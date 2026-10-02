package com.guclogistics.loads.application;

import com.guclogistics.loads.application.dto.CreateLoadRequest;
import com.guclogistics.loads.application.dto.LoadResponse;
import com.guclogistics.loads.application.dto.UpdateLoadRequest;
import com.guclogistics.loads.domain.LoadStatus;
import com.guclogistics.loads.infrastructure.persistence.LoadEntity;
import com.guclogistics.loads.infrastructure.persistence.LoadJpaRepository;
import com.guclogistics.loads.infrastructure.persistence.LoadStatusHistoryEntity;
import com.guclogistics.loads.infrastructure.persistence.LoadStatusHistoryJpaRepository;
import com.guclogistics.shared.api.PageResponse;
import com.guclogistics.shared.event.DomainEventPublisher;
import com.guclogistics.shared.events.loads.LoadPublishedEvent;
import com.guclogistics.shared.exception.DomainException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LoadService {

    private final LoadJpaRepository loadRepository;
    private final LoadStatusHistoryJpaRepository historyRepository;
    private final DomainEventPublisher eventPublisher;
    private final EntityManager entityManager;

    @Transactional
    public LoadResponse create(UUID userId, CreateLoadRequest request) {
        if (request.readyTo().isBefore(request.readyFrom())) {
            throw DomainException.business("ready_to must be after ready_from");
        }
        requireCompanyMember(request.shipperCompanyId(), userId);

        LoadEntity load = new LoadEntity();
        load.setShipperCompanyId(request.shipperCompanyId());
        load.setCreatedByUserId(userId);
        applyCreateFields(load, request);
        load.setStatus(LoadStatus.DRAFT);

        LoadEntity saved = loadRepository.save(load);
        recordStatusChange(saved.getId(), null, LoadStatus.DRAFT.name(), userId);
        return toResponse(saved);
    }

    private void requireCompanyMember(UUID companyId, UUID userId) {
        Number membership = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM company_members WHERE company_id = ?1 AND user_id = ?2")
                .setParameter(1, companyId)
                .setParameter(2, userId)
                .getSingleResult();
        if (membership.longValue() == 0) {
            throw DomainException.forbidden("Only company members can create loads");
        }
    }

    private boolean isCompanyMember(UUID companyId, UUID userId) {
        Number membership = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM company_members WHERE company_id = ?1 AND user_id = ?2")
                .setParameter(1, companyId).setParameter(2, userId).getSingleResult();
        return membership.longValue() > 0;
    }

    private LoadEntity requireCompanyLoad(UUID loadId, UUID userId) {
        LoadEntity load = loadRepository.findById(loadId)
                .orElseThrow(() -> DomainException.notFound("Load not found"));
        if (!load.getCreatedByUserId().equals(userId) && !isCompanyMember(load.getShipperCompanyId(), userId)) {
            throw DomainException.forbidden("Load company access denied");
        }
        return load;
    }

    @Transactional(readOnly = true)
    public LoadResponse getById(UUID loadId, UUID userId) {
        LoadEntity load = loadRepository.findById(loadId)
                .orElseThrow(() -> DomainException.notFound("Load not found"));
        if (load.getStatus() != LoadStatus.PUBLISHED && !load.getCreatedByUserId().equals(userId)
                && !isCompanyMember(load.getShipperCompanyId(), userId)) {
            throw DomainException.forbidden("Access denied");
        }
        return toResponse(load);
    }

    @Transactional
    public LoadResponse update(UUID loadId, UUID userId, UpdateLoadRequest request) {
        LoadEntity load = requireCompanyLoad(loadId, userId);
        if (load.getStatus() != LoadStatus.DRAFT) {
            throw DomainException.business("Only draft loads can be updated");
        }

        applyUpdateFields(load, request);
        if (load.getReadyTo().isBefore(load.getReadyFrom())) {
            throw DomainException.business("ready_to must be after ready_from");
        }

        return toResponse(loadRepository.save(load));
    }

    @Transactional
    public LoadResponse publish(UUID loadId, UUID userId) {
        LoadEntity load = requireCompanyLoad(loadId, userId);
        if (load.getStatus() != LoadStatus.DRAFT) {
            throw DomainException.business("Only draft loads can be published");
        }

        String companyStatus = findCompanyStatus(load.getShipperCompanyId());
        if (!"VERIFIED".equals(companyStatus)) {
            throw DomainException.business("Shipper company must be verified before publishing loads");
        }

        LoadStatus previous = load.getStatus();
        load.setStatus(LoadStatus.PUBLISHED);
        LoadEntity saved = loadRepository.save(load);
        recordStatusChange(saved.getId(), previous.name(), LoadStatus.PUBLISHED.name(), userId);

        eventPublisher.publish(new LoadPublishedEvent(
                saved.getId(),
                saved.getShipperCompanyId(),
                saved.getCreatedByUserId(),
                saved.getTitle()));

        return toResponse(saved);
    }

    @Transactional
    public LoadResponse cancel(UUID loadId, UUID userId) {
        LoadEntity load = requireCompanyLoad(loadId, userId);
        if (load.getStatus() != LoadStatus.DRAFT && load.getStatus() != LoadStatus.PUBLISHED) {
            throw DomainException.business("Only draft or published loads can be cancelled");
        }
        LoadStatus previous = load.getStatus();
        load.setStatus(LoadStatus.CANCELLED);
        LoadEntity saved = loadRepository.save(load);
        recordStatusChange(saved.getId(), previous.name(), LoadStatus.CANCELLED.name(), userId);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<LoadResponse> search(
            UUID userId,
            LoadStatus status,
            String pickupCountry,
            String dropoffCountry,
            BigDecimal minWeight,
            BigDecimal maxWeight,
            int page,
            int size) {
        return search(userId, false, status, pickupCountry, dropoffCountry, minWeight, maxWeight, page, size);
    }

    @Transactional(readOnly = true)
    public PageResponse<LoadResponse> search(
            UUID userId,
            boolean mine,
            LoadStatus status,
            String pickupCountry,
            String dropoffCountry,
            BigDecimal minWeight,
            BigDecimal maxWeight,
            int page,
            int size) {
        String normalizedPickup = pickupCountry != null ? pickupCountry.toUpperCase() : null;
        String normalizedDropoff = dropoffCountry != null ? dropoffCountry.toUpperCase() : null;
        Page<LoadEntity> result = mine
                ? loadRepository.searchMineLoads(userId, status != null ? status.name() : null, normalizedPickup,
                        normalizedDropoff, minWeight, maxWeight, PageRequest.of(page, size))
                : loadRepository.searchVisibleLoads(userId, status, normalizedPickup, normalizedDropoff, minWeight,
                        maxWeight, PageRequest.of(page, size));
        return PageResponse.from(result.map(this::toResponse));
    }

    private String findCompanyStatus(UUID companyId) {
        try {
            Object result = entityManager.createNativeQuery(
                    "SELECT status FROM companies WHERE id = ?1")
                    .setParameter(1, companyId)
                    .getSingleResult();
            return result.toString();
        } catch (NoResultException e) {
            throw DomainException.notFound("Shipper company not found");
        }
    }

    private void recordStatusChange(UUID loadId, String fromStatus, String toStatus, UUID changedBy) {
        LoadStatusHistoryEntity history = new LoadStatusHistoryEntity();
        history.setLoadId(loadId);
        history.setFromStatus(fromStatus);
        history.setToStatus(toStatus);
        history.setChangedBy(changedBy);
        historyRepository.save(history);
    }

    private void applyCreateFields(LoadEntity load, CreateLoadRequest request) {
        load.setTitle(request.title());
        load.setDescription(request.description());
        load.setPickupCountry(request.pickupCountry().toUpperCase());
        load.setPickupCity(request.pickupCity());
        load.setPickupAddress(request.pickupAddress());
        load.setPickupLat(request.pickupLat());
        load.setPickupLng(request.pickupLng());
        load.setDropoffCountry(request.dropoffCountry().toUpperCase());
        load.setDropoffCity(request.dropoffCity());
        load.setDropoffAddress(request.dropoffAddress());
        load.setDropoffLat(request.dropoffLat());
        load.setDropoffLng(request.dropoffLng());
        load.setReadyFrom(request.readyFrom());
        load.setReadyTo(request.readyTo());
        load.setWeightKg(request.weightKg());
        load.setVolumeM3(request.volumeM3());
        load.setVehicleRequirements(request.vehicleRequirements());
        load.setLoadType(request.loadType());
        load.setPalletCount(request.palletCount());
        load.setPackagingType(request.packagingType());
        load.setCargoValue(request.cargoValue());
        load.setContactPerson(request.contactPerson());
        load.setContactPhone(request.contactPhone());
        load.setReferenceNo(request.referenceNo());
        load.setDoorRamp(request.doorRamp());
        load.setAdr(Boolean.TRUE.equals(request.adr()));
        load.setUnNumber(request.unNumber());
        load.setColdChain(Boolean.TRUE.equals(request.coldChain()));
        load.setTemperatureMin(request.temperatureMin());
        load.setTemperatureMax(request.temperatureMax());
        load.setTailLift(Boolean.TRUE.equals(request.tailLift()));
        load.setForklift(Boolean.TRUE.equals(request.forklift()));
        load.setCustomsRequired(Boolean.TRUE.equals(request.customsRequired()));
        load.setCustomsReference(request.customsReference());
        load.setInsuranceRequired(Boolean.TRUE.equals(request.insuranceRequired()));
        load.setExpectedPrice(request.expectedPrice());
        load.setCurrency(request.currency().toUpperCase());
    }

    private void applyUpdateFields(LoadEntity load, UpdateLoadRequest request) {
        if (request.title() != null)
            load.setTitle(request.title());
        if (request.description() != null)
            load.setDescription(request.description());
        if (request.pickupCountry() != null)
            load.setPickupCountry(request.pickupCountry().toUpperCase());
        if (request.pickupCity() != null)
            load.setPickupCity(request.pickupCity());
        if (request.pickupAddress() != null)
            load.setPickupAddress(request.pickupAddress());
        if (request.pickupLat() != null)
            load.setPickupLat(request.pickupLat());
        if (request.pickupLng() != null)
            load.setPickupLng(request.pickupLng());
        if (request.dropoffCountry() != null)
            load.setDropoffCountry(request.dropoffCountry().toUpperCase());
        if (request.dropoffCity() != null)
            load.setDropoffCity(request.dropoffCity());
        if (request.dropoffAddress() != null)
            load.setDropoffAddress(request.dropoffAddress());
        if (request.dropoffLat() != null)
            load.setDropoffLat(request.dropoffLat());
        if (request.dropoffLng() != null)
            load.setDropoffLng(request.dropoffLng());
        if (request.readyFrom() != null)
            load.setReadyFrom(request.readyFrom());
        if (request.readyTo() != null)
            load.setReadyTo(request.readyTo());
        if (request.weightKg() != null)
            load.setWeightKg(request.weightKg());
        if (request.volumeM3() != null)
            load.setVolumeM3(request.volumeM3());
        if (request.vehicleRequirements() != null)
            load.setVehicleRequirements(request.vehicleRequirements());
        if (request.currency() != null)
            load.setCurrency(request.currency().toUpperCase());
    }

    private LoadResponse toResponse(LoadEntity load) {
        return new LoadResponse(
                load.getId(),
                load.getShipperCompanyId(),
                load.getCreatedByUserId(),
                load.getTitle(),
                load.getDescription(),
                load.getPickupCountry(),
                load.getPickupCity(),
                load.getPickupAddress(),
                load.getPickupLat(),
                load.getPickupLng(),
                load.getDropoffCountry(),
                load.getDropoffCity(),
                load.getDropoffAddress(),
                load.getDropoffLat(),
                load.getDropoffLng(),
                load.getReadyFrom(),
                load.getReadyTo(),
                load.getWeightKg(),
                load.getVolumeM3(),
                load.getVehicleRequirements(),
                load.getLoadType(),
                load.getPalletCount(),
                load.getPackagingType(),
                load.getCargoValue(),
                load.getContactPerson(),
                load.getContactPhone(),
                load.getReferenceNo(),
                load.getDoorRamp(),
                load.isAdr(),
                load.getUnNumber(),
                load.isColdChain(),
                load.getTemperatureMin(),
                load.getTemperatureMax(),
                load.isTailLift(),
                load.isForklift(),
                load.isCustomsRequired(),
                load.getCustomsReference(),
                load.isInsuranceRequired(),
                load.getExpectedPrice(),
                load.getCurrency(),
                load.getStatus(),
                load.getVersion(),
                load.getCreatedAt(),
                load.getUpdatedAt());
    }
}
