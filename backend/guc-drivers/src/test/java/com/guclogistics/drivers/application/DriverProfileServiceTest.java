package com.guclogistics.drivers.application;

import com.guclogistics.drivers.application.dto.CreateDriverProfileRequest;
import com.guclogistics.drivers.application.dto.UpdateDriverProfileRequest;
import com.guclogistics.drivers.domain.DriverStatus;
import com.guclogistics.drivers.infrastructure.persistence.DriverProfileEntity;
import com.guclogistics.drivers.infrastructure.persistence.DriverProfileJpaRepository;
import com.guclogistics.shared.exception.DomainException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DriverProfileServiceTest {

    @Mock private DriverProfileJpaRepository repository;

    @InjectMocks
    private DriverProfileService service;

    @Test
    void createPersistsPendingProfile() {
        UUID userId = UUID.randomUUID();
        CreateDriverProfileRequest request = new CreateDriverProfileRequest("LIC-1", "tr", 5, null);

        when(repository.existsByUserId(userId)).thenReturn(false);
        when(repository.save(any(DriverProfileEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.create(userId, request);

        assertThat(response.licenseNumber()).isEqualTo("LIC-1");
        assertThat(response.licenseCountry()).isEqualTo("TR");
        assertThat(response.status()).isEqualTo(DriverStatus.PENDING);
    }

    @Test
    void createDuplicateProfileConflict() {
        UUID userId = UUID.randomUUID();
        when(repository.existsByUserId(userId)).thenReturn(true);

        assertThatThrownBy(() -> service.create(userId,
                new CreateDriverProfileRequest("LIC-1", "tr", 1, null)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void getMineReturnsProfile() {
        UUID userId = UUID.randomUUID();
        DriverProfileEntity profile = profile(userId);
        when(repository.findByUserId(userId)).thenReturn(Optional.of(profile));

        assertThat(service.getMine(userId).userId()).isEqualTo(userId);
    }

    @Test
    void getMineNotFound() {
        UUID userId = UUID.randomUUID();
        when(repository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getMine(userId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Driver profile not found");
    }

    @Test
    void updateMineAppliesChanges() {
        UUID userId = UUID.randomUUID();
        DriverProfileEntity profile = profile(userId);
        when(repository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(repository.save(profile)).thenReturn(profile);

        var response = service.updateMine(userId,
                new UpdateDriverProfileRequest("LIC-NEW", "de", 10, UUID.randomUUID()));

        assertThat(response.licenseNumber()).isEqualTo("LIC-NEW");
        assertThat(response.licenseCountry()).isEqualTo("DE");
        assertThat(response.yearsExperience()).isEqualTo(10);
    }

    @Test
    void updateStatusFromVerificationSuccess() {
        UUID profileId = UUID.randomUUID();
        when(repository.updateStatus(profileId, DriverStatus.VERIFIED.name())).thenReturn(1);

        service.updateStatusFromVerification(profileId, DriverStatus.VERIFIED);

        verify(repository).updateStatus(profileId, DriverStatus.VERIFIED.name());
    }

    @Test
    void updateStatusFromVerificationNotFound() {
        UUID profileId = UUID.randomUUID();
        when(repository.updateStatus(profileId, DriverStatus.REJECTED.name())).thenReturn(0);

        assertThatThrownBy(() -> service.updateStatusFromVerification(profileId, DriverStatus.REJECTED))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Driver profile not found");
    }

    private static DriverProfileEntity profile(UUID userId) {
        DriverProfileEntity profile = new DriverProfileEntity();
        profile.setUserId(userId);
        profile.setLicenseNumber("LIC-1");
        profile.setLicenseCountry("TR");
        profile.setYearsExperience(3);
        profile.setStatus(DriverStatus.PENDING);
        return profile;
    }
}
