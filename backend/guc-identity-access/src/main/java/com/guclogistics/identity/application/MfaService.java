package com.guclogistics.identity.application;

import com.guclogistics.identity.application.dto.MfaEnrollResponse;
import com.guclogistics.identity.infrastructure.persistence.MfaRecoveryCodeEntity;
import com.guclogistics.identity.infrastructure.persistence.MfaRecoveryCodeJpaRepository;
import com.guclogistics.identity.infrastructure.persistence.MfaSettingsEntity;
import com.guclogistics.identity.infrastructure.persistence.MfaSettingsJpaRepository;
import com.guclogistics.identity.infrastructure.security.AesGcmEncryptor;
import com.guclogistics.identity.infrastructure.security.TokenHasher;
import com.guclogistics.identity.infrastructure.security.TotpService;
import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.shared.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MfaService {

    private static final int RECOVERY_CODE_COUNT = 8;

    private final MfaSettingsJpaRepository mfaSettingsRepository;
    private final MfaRecoveryCodeJpaRepository recoveryCodeRepository;
    private final TotpService totpService;
    private final AesGcmEncryptor encryptor;
    private final TokenHasher tokenHasher;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public MfaEnrollResponse enroll(AuthenticatedUser user) {
        String secret = totpService.generateSecret();
        MfaSettingsEntity settings = mfaSettingsRepository.findById(user.userId()).orElseGet(MfaSettingsEntity::new);
        settings.setUserId(user.userId());
        settings.setTotpSecretEnc(encryptor.encrypt(secret));
        settings.setEnabled(false);
        settings.setVerifiedAt(null);
        mfaSettingsRepository.save(settings);

        List<String> recoveryCodes = generateRecoveryCodes(user.userId());
        String uri = totpService.otpAuthUri("GucLogistics", user.email(), secret);
        return new MfaEnrollResponse(uri, secret, recoveryCodes);
    }

    @Transactional
    public void enable(AuthenticatedUser user, String code) {
        MfaSettingsEntity settings = mfaSettingsRepository.findById(user.userId())
                .orElseThrow(() -> DomainException.business("MFA enrollment required first"));
        String secret = encryptor.decrypt(settings.getTotpSecretEnc());
        if (!totpService.verify(secret, code)) {
            throw DomainException.business("Invalid MFA code");
        }
        settings.setEnabled(true);
        settings.setVerifiedAt(Instant.now());
        mfaSettingsRepository.save(settings);
    }

    @Transactional
    public void disable(AuthenticatedUser user, String code) {
        if (!verifyCode(user.userId(), code)) {
            throw DomainException.business("Invalid MFA code");
        }
        mfaSettingsRepository.findById(user.userId()).ifPresent(settings -> {
            settings.setEnabled(false);
            mfaSettingsRepository.save(settings);
        });
    }

    @Transactional
    public boolean verifyCode(UUID userId, String code) {
        MfaSettingsEntity settings = mfaSettingsRepository.findById(userId).orElse(null);
        if (settings == null || !settings.isEnabled()) {
            // During enrollment enable flow settings may not be enabled yet
            if (settings != null) {
                String secret = encryptor.decrypt(settings.getTotpSecretEnc());
                return totpService.verify(secret, code);
            }
            return false;
        }
        String secret = encryptor.decrypt(settings.getTotpSecretEnc());
        if (totpService.verify(secret, code)) {
            return true;
        }
        String codeHash = tokenHasher.sha256(code.replace("-", "").toUpperCase());
        return recoveryCodeRepository.findByUserIdAndUsedAtIsNull(userId).stream()
                .filter(rc -> rc.getCodeHash().equals(codeHash))
                .findFirst()
                .map(rc -> {
                    rc.setUsedAt(Instant.now());
                    recoveryCodeRepository.save(rc);
                    return true;
                })
                .orElse(false);
    }

    private List<String> generateRecoveryCodes(UUID userId) {
        recoveryCodeRepository.findByUserIdAndUsedAtIsNull(userId).forEach(rc -> {
            rc.setUsedAt(Instant.now());
            recoveryCodeRepository.save(rc);
        });
        List<String> plainCodes = new ArrayList<>();
        for (int i = 0; i < RECOVERY_CODE_COUNT; i++) {
            String code = randomRecoveryCode();
            plainCodes.add(code);
            MfaRecoveryCodeEntity entity = new MfaRecoveryCodeEntity();
            entity.setUserId(userId);
            entity.setCodeHash(tokenHasher.sha256(code.replace("-", "").toUpperCase()));
            recoveryCodeRepository.save(entity);
        }
        return plainCodes;
    }

    private String randomRecoveryCode() {
        byte[] bytes = new byte[5];
        secureRandom.nextBytes(bytes);
        String hex = java.util.HexFormat.of().formatHex(bytes).toUpperCase();
        return hex.substring(0, 5) + "-" + hex.substring(5);
    }
}
