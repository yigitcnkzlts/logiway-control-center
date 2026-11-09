package com.guclogistics.matching.application;

import com.guclogistics.matching.application.dto.ShipmentResponse;
import com.guclogistics.matching.domain.ShipmentStatus;
import com.guclogistics.matching.infrastructure.persistence.ShipmentEntity;
import com.guclogistics.matching.infrastructure.persistence.ShipmentJpaRepository;
import com.guclogistics.matching.infrastructure.persistence.MatchJpaRepository;
import com.guclogistics.shared.exception.DomainException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShipmentService {
    private final ShipmentJpaRepository repository;
    private final MatchJpaRepository matchRepository;
    private final EntityManager entityManager;

    @Transactional
    public ShipmentResponse createForMatch(UUID matchId, UUID loadId, UUID offerId) {
        Object[] row = (Object[]) entityManager.createNativeQuery("""
                SELECT l.shipper_company_id, o.offerer_type, o.offerer_id, o.vehicle_id, o.driver_profile_id
                FROM loads l JOIN offers o ON o.id = ?2 WHERE l.id = ?1
                """).setParameter(1, loadId).setParameter(2, offerId).getSingleResult();
        if (row[3] == null || row[4] == null) throw DomainException.business("Accepted offer has no assignment");
        ShipmentEntity shipment = new ShipmentEntity();
        shipment.setLoadId(loadId);
        shipment.setAcceptedOfferId(offerId);
        shipment.setMatchId(matchId);
        shipment.setShipperCompanyId((UUID) row[0]);
        shipment.setCarrierCompanyId("COMPANY".equals(row[1].toString()) ? (UUID) row[2] : null);
        shipment.setVehicleId((UUID) row[3]);
        shipment.setDriverProfileId((UUID) row[4]);
        shipment.setStatus(ShipmentStatus.ASSIGNED);
        try {
            return toResponse(repository.saveAndFlush(shipment));
        } catch (DataIntegrityViolationException e) {
            throw DomainException.conflict("Driver or vehicle already has an active shipment");
        }
    }

    @Transactional
    public ShipmentResponse transition(UUID shipmentId, UUID userId, ShipmentStatus target) {
        ShipmentEntity shipment = repository.findById(shipmentId)
                .orElseThrow(() -> DomainException.notFound("Shipment not found"));
        TransitionActor actor = requireTransitionActor(shipment, userId);
        if (!allowed(shipment.getStatus(), target)) throw DomainException.business("Invalid shipment status transition");
        requireTransitionPermission(actor, target);
        shipment.setStatus(target);
        return toResponse(repository.save(shipment));
    }

    @Transactional(readOnly = true)
    public ShipmentResponse getForMatch(UUID matchId, UUID userId) {
        ShipmentEntity shipment = repository.findByMatchId(matchId)
                .orElseThrow(() -> DomainException.notFound("Shipment not found"));
        requireParticipant(shipment, userId);
        return toResponse(shipment);
    }

    @Transactional(readOnly = true)
    public List<ShipmentResponse> listForUser(UUID userId) {
        var matchIds = matchRepository.findForUser(userId).stream()
                .map(match -> match.getId())
                .toList();
        if (matchIds.isEmpty()) return List.of();
        return repository.findByMatchIdInOrderByUpdatedAtDesc(matchIds).stream()
                .map(this::toResponse)
                .toList();
    }

    private boolean allowed(ShipmentStatus from, ShipmentStatus to) {
        if (to == ShipmentStatus.CANCELLED) return from == ShipmentStatus.CREATED || from == ShipmentStatus.ASSIGNED;
        return (from == ShipmentStatus.CREATED && to == ShipmentStatus.ASSIGNED)
                || (from == ShipmentStatus.ASSIGNED && to == ShipmentStatus.PICKED_UP)
                || (from == ShipmentStatus.PICKED_UP && to == ShipmentStatus.IN_TRANSIT)
                || (from == ShipmentStatus.IN_TRANSIT && to == ShipmentStatus.DELIVERED);
    }

    /**
     * Operational milestones belong to the assigned driver/carrier. A shipper can observe the
     * journey, but cannot mark its own freight as picked up or delivered. Cancellation is a
     * managerial action and is intentionally limited to OWNER/ADMIN members on either side.
     */
    private void requireTransitionPermission(TransitionActor actor, ShipmentStatus target) {
        if (target == ShipmentStatus.CANCELLED) {
            if (actor != TransitionActor.SHIPPER_MANAGER && actor != TransitionActor.CARRIER_MANAGER) {
                throw DomainException.forbidden("Only a shipper or carrier manager can cancel a shipment");
            }
            return;
        }
        if (actor != TransitionActor.DRIVER && actor != TransitionActor.CARRIER
                && actor != TransitionActor.CARRIER_MANAGER) {
            throw DomainException.forbidden("Only the assigned driver or carrier can update shipment progress");
        }
    }

    private TransitionActor requireTransitionActor(ShipmentEntity shipment, UUID userId) {
        Object result = entityManager.createNativeQuery("""
                SELECT CASE
                  WHEN EXISTS (SELECT 1 FROM driver_profiles d
                    WHERE d.id = ?1 AND d.user_id = ?2) THEN 'DRIVER'
                  WHEN ?3 IS NOT NULL AND EXISTS (SELECT 1 FROM company_members cm
                    WHERE cm.company_id = ?3 AND cm.user_id = ?2
                      AND cm.member_role IN ('OWNER','ADMIN')) THEN 'CARRIER_MANAGER'
                  WHEN ?3 IS NOT NULL AND EXISTS (SELECT 1 FROM company_members cm
                    WHERE cm.company_id = ?3 AND cm.user_id = ?2) THEN 'CARRIER'
                  WHEN EXISTS (SELECT 1 FROM company_members cm
                    WHERE cm.company_id = ?4 AND cm.user_id = ?2
                      AND cm.member_role IN ('OWNER','ADMIN')) THEN 'SHIPPER_MANAGER'
                  WHEN EXISTS (SELECT 1 FROM company_members cm
                    WHERE cm.company_id = ?4 AND cm.user_id = ?2) THEN 'SHIPPER'
                  ELSE NULL
                END
                """)
                .setParameter(1, shipment.getDriverProfileId())
                .setParameter(2, userId)
                .setParameter(3, shipment.getCarrierCompanyId())
                .setParameter(4, shipment.getShipperCompanyId())
                .getSingleResult();
        if (result == null) throw DomainException.forbidden("Shipment access denied");
        return TransitionActor.valueOf(result.toString());
    }

    private void requireParticipant(ShipmentEntity shipment, UUID userId) {
        Number count = (Number) entityManager.createNativeQuery("""
                SELECT COUNT(*) FROM company_members WHERE user_id = ?1
                AND (company_id = ?2 OR (?3 IS NOT NULL AND company_id = ?3))
                """).setParameter(1, userId).setParameter(2, shipment.getShipperCompanyId())
                .setParameter(3, shipment.getCarrierCompanyId()).getSingleResult();
        Object driverUser = entityManager.createNativeQuery("SELECT user_id FROM driver_profiles WHERE id=?1")
                .setParameter(1, shipment.getDriverProfileId()).getSingleResult();
        if (count.longValue() == 0 && !userId.equals(driverUser)) throw DomainException.forbidden("Shipment access denied");
    }

    private ShipmentResponse toResponse(ShipmentEntity s) {
        return new ShipmentResponse(s.getId(), s.getLoadId(), s.getAcceptedOfferId(), s.getMatchId(),
                s.getShipperCompanyId(), s.getCarrierCompanyId(), s.getVehicleId(), s.getDriverProfileId(),
                s.getStatus(), s.getVersion(), s.getCreatedAt(), s.getUpdatedAt());
    }

    private enum TransitionActor {
        SHIPPER,
        SHIPPER_MANAGER,
        CARRIER,
        CARRIER_MANAGER,
        DRIVER
    }
}
