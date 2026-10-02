package com.guclogistics.identity.application;

import com.guclogistics.identity.infrastructure.persistence.MfaRecoveryCodeEntity;
import com.guclogistics.identity.infrastructure.persistence.MfaRecoveryCodeJpaRepository;
import com.guclogistics.identity.infrastructure.persistence.MfaSettingsEntity;
import com.guclogistics.identity.infrastructure.persistence.MfaSettingsJpaRepository;
import com.guclogistics.identity.infrastructure.security.AesGcmEncryptor;
import com.guclogistics.identity.infrastructure.security.TokenHasher;
import com.guclogistics.identity.infrastructure.security.TotpService;
import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.shared.security.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MfaServiceTest {

    private static final String ENCRYPTION_KEY = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";

    @Mock private MfaSettingsJpaRepository mfaSettingsRepository;
    @Mock private MfaRecoveryCodeJpaRepository recoveryCodeRepository;
    @Spy private TotpService totpService = new TotpService();
    @Spy private AesGcmEncryptor encryptor = new AesGcmEncryptor(ENCRYPTION_KEY);
    @Spy private TokenHasher tokenHasher = new TokenHasher();

    @InjectMocks
    private MfaService mfaService;

    private AuthenticatedUser user;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new AuthenticatedUser(userId, UUID.randomUUID(), "mfa@example.com", Set.of("SHIPPER"), false);
    }

    @Test
    void enrollCreatesSettingsAndRecoveryCodes() {
        when(mfaSettingsRepository.findById(userId)).thenReturn(Optional.empty());
        when(mfaSettingsRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(recoveryCodeRepository.findByUserIdAndUsedAtIsNull(userId)).thenReturn(List.of());
        when(recoveryCodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = mfaService.enroll(user);

        assertThat(response.otpAuthUri()).contains("otpauth://totp/");
        assertThat(response.secret()).isNotBlank();
        assertThat(response.recoveryCodes()).hasSize(8);
        verify(mfaSettingsRepository).save(any(MfaSettingsEntity.class));
    }

    @Test
    void enableWithValidCode() throws Exception {
        String secret = totpService.generateSecret();
        MfaSettingsEntity settings = new MfaSettingsEntity();
        settings.setUserId(userId);
        settings.setTotpSecretEnc(encryptor.encrypt(secret));
        settings.setEnabled(false);

        String code = currentTotpCode(secret);

        when(mfaSettingsRepository.findById(userId)).thenReturn(Optional.of(settings));
        when(mfaSettingsRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        mfaService.enable(user, code);

        assertThat(settings.isEnabled()).isTrue();
        assertThat(settings.getVerifiedAt()).isNotNull();
    }

    @Test
    void enableWithInvalidCodeThrows() {
        MfaSettingsEntity settings = new MfaSettingsEntity();
        settings.setUserId(userId);
        settings.setTotpSecretEnc(encryptor.encrypt(totpService.generateSecret()));

        when(mfaSettingsRepository.findById(userId)).thenReturn(Optional.of(settings));

        assertThatThrownBy(() -> mfaService.enable(user, "000000"))
                .isInstanceOf(DomainException.class);
    }

    @Test
    void verifyCodeUsesRecoveryCodeWhenTotpFails() {
        String secret = totpService.generateSecret();
        String recoveryPlain = "ABCDE-FGHIJ";
        String recoveryHash = tokenHasher.sha256(recoveryPlain.replace("-", "").toUpperCase());

        MfaSettingsEntity settings = new MfaSettingsEntity();
        settings.setUserId(userId);
        settings.setTotpSecretEnc(encryptor.encrypt(secret));
        settings.setEnabled(true);

        MfaRecoveryCodeEntity recovery = new MfaRecoveryCodeEntity();
        recovery.setUserId(userId);
        recovery.setCodeHash(recoveryHash);

        when(mfaSettingsRepository.findById(userId)).thenReturn(Optional.of(settings));
        when(recoveryCodeRepository.findByUserIdAndUsedAtIsNull(userId)).thenReturn(List.of(recovery));
        when(recoveryCodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThat(mfaService.verifyCode(userId, recoveryPlain)).isTrue();
        assertThat(recovery.getUsedAt()).isNotNull();
    }

    private String currentTotpCode(String secret) throws Exception {
        var method = TotpService.class.getDeclaredMethod("generateCode", String.class, long.class);
        method.setAccessible(true);
        long step = java.time.Instant.now().getEpochSecond() / 30;
        return (String) method.invoke(totpService, secret, step);
    }
}
