package com.guclogistics.drivers.application;

import com.guclogistics.drivers.application.dto.CreateDriverProfileRequest;
import com.guclogistics.drivers.application.dto.DriverProfileResponse;
import com.guclogistics.drivers.application.dto.UpdateDriverProfileRequest;
import com.guclogistics.drivers.domain.DriverStatus;
import com.guclogistics.drivers.infrastructure.persistence.DriverProfileEntity;
import com.guclogistics.drivers.infrastructure.persistence.DriverProfileJpaRepository;
import com.guclogistics.shared.exception.DomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DriverProfileService {

    private final DriverProfileJpaRepository repository;

    @Transactional
    public DriverProfileResponse create(UUID userId, CreateDriverProfileRequest request) {
        if (repository.existsByUserId(userId)) {
            throw DomainException.conflict("Driver profile already exists");
        }

        DriverProfileEntity profile = new DriverProfileEntity();
        profile.setUserId(userId);
        profile.setLicenseNumber(request.licenseNumber());
        profile.setLicenseCountry(request.licenseCountry().toUpperCase());
        profile.setYearsExperience(request.yearsExperience());
        profile.setCompanyId(request.companyId());
        profile.setStatus(DriverStatus.PENDING);

        return toResponse(repository.save(profile));
    }

    @Transactional(readOnly = true)
    public DriverProfileResponse getMine(UUID userId) {
        return repository.findByUserId(userId)
                .map(this::toResponse)
                .orElseThrow(() -> DomainException.notFound("Driver profile not found"));
    }

    @Transactional
    public DriverProfileResponse updateMine(UUID userId, UpdateDriverProfileRequest request) {
        DriverProfileEntity profile = repository.findByUserId(userId)
                .orElseThrow(() -> DomainException.notFound("Driver profile not found"));

        if (request.licenseNumber() != null) {
            profile.setLicenseNumber(request.licenseNumber());
        }
        if (request.licenseCountry() != null) {
            profile.setLicenseCountry(request.licenseCountry().toUpperCase());
        }
        if (request.yearsExperience() != null) {
            profile.setYearsExperience(request.yearsExperience());
        }
        if (request.companyId() != null) {
            profile.setCompanyId(request.companyId());
        }

        return toResponse(repository.save(profile));
    }

    @Transactional
    public void updateStatusFromVerification(UUID profileId, DriverStatus status) {
        int updated = repository.updateStatus(profileId, status.name());
        if (updated == 0) {
            throw DomainException.notFound("Driver profile not found for verification update");
        }
    }

    private DriverProfileResponse toResponse(DriverProfileEntity profile) {
        return new DriverProfileResponse(
                profile.getId(),
                profile.getUserId(),
                profile.getLicenseNumber(),
                profile.getLicenseCountry(),
                profile.getYearsExperience(),
                profile.getStatus(),
                profile.getCompanyId(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
