package com.guclogistics.vehicles.application;

import com.guclogistics.vehicles.application.dto.CreateVehicleRequest;
import com.guclogistics.vehicles.application.dto.UpdateVehicleRequest;
import com.guclogistics.vehicles.application.dto.VehicleResponse;
import com.guclogistics.vehicles.domain.VehicleStatus;
import com.guclogistics.vehicles.domain.OwnerType;
import com.guclogistics.vehicles.infrastructure.persistence.VehicleEntity;
import com.guclogistics.vehicles.infrastructure.persistence.VehicleJpaRepository;
import com.guclogistics.shared.exception.DomainException;
import lombok.RequiredArgsConstructor;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleJpaRepository repository;
    private final EntityManager entityManager;

    @Transactional
    public VehicleResponse create(UUID userId, CreateVehicleRequest request) {
        if (request.ownerType() == OwnerType.USER && !request.ownerId().equals(userId)) {
            throw DomainException.forbidden("Cannot create a vehicle for another user");
        }
        if (request.ownerType() == OwnerType.COMPANY) requireCompanyMember(request.ownerId(), userId);
        VehicleEntity vehicle = new VehicleEntity();
        vehicle.setOwnerType(request.ownerType());
        vehicle.setOwnerId(request.ownerId());
        vehicle.setPlate(request.plate());
        vehicle.setVin(request.vin());
        vehicle.setType(request.type());
        vehicle.setCapacityKg(request.capacityKg());
        vehicle.setVolumeM3(request.volumeM3());
        vehicle.setStatus(VehicleStatus.ACTIVE);
        vehicle.setCreatedByUserId(userId);

        return toResponse(repository.save(vehicle));
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> listMine(UUID userId) {
        return repository.findAccessible(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VehicleResponse getById(UUID vehicleId, UUID userId) {
        VehicleEntity vehicle = requireOwned(vehicleId, userId);
        return toResponse(vehicle);
    }

    @Transactional
    public VehicleResponse update(UUID vehicleId, UUID userId, UpdateVehicleRequest request) {
        VehicleEntity vehicle = requireOwned(vehicleId, userId);

        if (request.plate() != null) {
            vehicle.setPlate(request.plate());
        }
        if (request.vin() != null) {
            vehicle.setVin(request.vin());
        }
        if (request.type() != null) {
            vehicle.setType(request.type());
        }
        if (request.capacityKg() != null) {
            vehicle.setCapacityKg(request.capacityKg());
        }
        if (request.volumeM3() != null) {
            vehicle.setVolumeM3(request.volumeM3());
        }
        if (request.status() != null) {
            vehicle.setStatus(request.status());
        }

        return toResponse(repository.save(vehicle));
    }

    @Transactional
    public void delete(UUID vehicleId, UUID userId) {
        VehicleEntity vehicle = requireOwned(vehicleId, userId);
        repository.delete(vehicle);
    }

    private VehicleEntity requireOwned(UUID vehicleId, UUID userId) {
        return repository.findAccessibleById(vehicleId, userId)
                .orElseThrow(() -> DomainException.forbidden("Vehicle not found or access denied"));
    }

    private void requireCompanyMember(UUID companyId, UUID userId) {
        Number count = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM company_members WHERE company_id=?1 AND user_id=?2")
                .setParameter(1, companyId).setParameter(2, userId).getSingleResult();
        if (count.longValue() == 0L) throw DomainException.forbidden("Company vehicle access denied");
    }

    private VehicleResponse toResponse(VehicleEntity vehicle) {
        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getOwnerType(),
                vehicle.getOwnerId(),
                vehicle.getPlate(),
                vehicle.getVin(),
                vehicle.getType(),
                vehicle.getCapacityKg(),
                vehicle.getVolumeM3(),
                vehicle.getStatus(),
                vehicle.getCreatedByUserId(),
                vehicle.getCreatedAt(),
                vehicle.getUpdatedAt()
        );
    }
}
