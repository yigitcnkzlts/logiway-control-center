package com.guclogistics.offers.application;

import com.guclogistics.offers.application.dto.CreateOfferRequest;
import com.guclogistics.offers.application.dto.CounterOfferRequest;
import com.guclogistics.offers.application.dto.OfferResponse;
import com.guclogistics.offers.application.dto.OfferRoundResponse;
import com.guclogistics.offers.domain.OfferStatus;
import com.guclogistics.offers.domain.OffererType;
import com.guclogistics.offers.infrastructure.persistence.OfferEntity;
import com.guclogistics.offers.infrastructure.persistence.OfferJpaRepository;
import com.guclogistics.shared.event.DomainEventPublisher;
import com.guclogistics.shared.events.offers.OfferAcceptedEvent;
import com.guclogistics.shared.events.offers.OfferRejectedEvent;
import com.guclogistics.shared.events.offers.OfferSubmittedEvent;
import com.guclogistics.shared.exception.DomainException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.sql.Timestamp;

@Service
@RequiredArgsConstructor
public class OfferService {

    private final OfferJpaRepository offerRepository;
    private final DomainEventPublisher eventPublisher;
    private final EntityManager entityManager;

    @Transactional
    public OfferResponse submitOffer(UUID loadId, UUID userId, CreateOfferRequest request) {
        LoadSnapshot load = requirePublishedLoad(loadId);
        UUID offererId = resolveOffererId(userId, request);
        requireIndependentOfferer(load, userId, request.offererType(), offererId);
        TransportAssignment assignment = resolveTransportAssignment(userId, request, offererId);

        OfferEntity offer = new OfferEntity();
        offer.setLoadId(loadId);
        offer.setOffererType(request.offererType());
        offer.setOffererId(offererId);
        offer.setCreatedByUserId(userId);
        offer.setAmount(request.amount());
        offer.setCurrency(request.currency().toUpperCase());
        offer.setMessage(request.message());
        offer.setVehicleId(assignment.vehicleId());
        offer.setDriverProfileId(assignment.driverProfileId());
        offer.setVehiclePlate(assignment.vehiclePlate());
        offer.setVehicleType(assignment.vehicleType());
        offer.setDriverName(assignment.driverName());
        offer.setDriverPhone(assignment.driverPhone());
        offer.setEstimatedTransitHours(request.estimatedTransitHours());
        offer.setAvailableAt(request.availableAt());
        offer.setValidUntil(request.validUntil());
        offer.setStatus(OfferStatus.PENDING);

        OfferEntity saved;
        try {
            saved = offerRepository.save(offer);
        } catch (DataIntegrityViolationException e) {
            throw DomainException.conflict("A pending offer already exists for this load");
        }
        insertRound(saved, 1, "CARRIER", userId, request.message());

        eventPublisher.publish(new OfferSubmittedEvent(
                saved.getId(),
                saved.getLoadId(),
                saved.getOffererType().name(),
                saved.getOffererId(),
                saved.getCreatedByUserId(),
                saved.getAmount(),
                saved.getCurrency()
        ));

        return toResponse(saved);
    }

    @Transactional
    public OfferResponse accept(UUID offerId, UUID userId) {
        OfferEntity offer = offerRepository.findById(offerId)
                .orElseThrow(() -> DomainException.notFound("Offer not found"));

        LoadSnapshot load = requireLoad(offer.getLoadId());
        requireLoadManager(load, userId);
        if (offer.getStatus() != OfferStatus.PENDING) {
            throw DomainException.business("Only pending offers can be accepted");
        }
        if (!"PUBLISHED".equals(load.status())) {
            throw DomainException.business("Load must be published to accept an offer");
        }

        int updated = entityManager.createNativeQuery("""
                        UPDATE loads
                        SET status = 'MATCHED', version = version + 1, updated_at = NOW()
                        WHERE id = ?1 AND status = 'PUBLISHED' AND version = ?2
                        """)
                .setParameter(1, load.id())
                .setParameter(2, load.version())
                .executeUpdate();

        if (updated == 0) {
            throw DomainException.conflict("Load is no longer available for matching");
        }

        offer.setStatus(OfferStatus.ACCEPTED);
        OfferEntity saved = offerRepository.save(offer);
        closeOpenRound(offerId, "ACCEPTED");
        offerRepository.rejectOtherPendingOffers(load.id(), saved.getId());

        eventPublisher.publish(new OfferAcceptedEvent(
                saved.getId(),
                saved.getLoadId(),
                load.createdByUserId(),
                saved.getOffererType().name(),
                saved.getOffererId(),
                saved.getCreatedByUserId()
        ));

        return toResponse(saved);
    }

    @Transactional
    public OfferResponse counter(UUID offerId, UUID userId, CounterOfferRequest request) {
        OfferEntity offer = offerRepository.findById(offerId)
                .orElseThrow(() -> DomainException.notFound("Offer not found"));
        if (offer.getStatus() != OfferStatus.PENDING) throw DomainException.business("Only pending offers can be countered");
        if (offer.getVersion() != request.expectedOfferVersion()) throw DomainException.conflict("Offer changed; reload before countering");
        LoadSnapshot load = requireLoad(offer.getLoadId());
        String side;
        if (load.createdByUserId().equals(userId) || isCompanyMember(load.shipperCompanyId(), userId)) side = "SHIPPER";
        else if (offer.getCreatedByUserId().equals(userId)
                || (offer.getOffererType() == OffererType.COMPANY && isCompanyMember(offer.getOffererId(), userId))) side = "CARRIER";
        else throw DomainException.forbidden("Offer access denied");
        Object[] latest = latestRoundForUpdate(offerId);
        if (side.equals(latest[1].toString())) throw DomainException.business("The other party must respond before another counter offer");
        closeOpenRound(offerId, "SUPERSEDED");
        offer.setAmount(request.amount());
        offer.setMessage(request.message());
        OfferEntity saved = offerRepository.saveAndFlush(offer);
        insertRound(saved, ((Number) latest[0]).intValue() + 1, side, userId, request.message());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OfferRoundResponse> rounds(UUID offerId, UUID userId) {
        OfferEntity offer = offerRepository.findById(offerId)
                .orElseThrow(() -> DomainException.notFound("Offer not found"));
        if (!offer.getCreatedByUserId().equals(userId)) requireLoadMember(requireLoad(offer.getLoadId()), userId);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                SELECT id,round_number,amount,currency,proposed_by,proposed_by_user_id,message,status,version,created_at
                FROM offer_rounds WHERE offer_id=?1 ORDER BY round_number
                """).setParameter(1, offerId).getResultList();
        return rows.stream().map(r -> new OfferRoundResponse((UUID)r[0],((Number)r[1]).intValue(),
                (java.math.BigDecimal)r[2],r[3].toString(),r[4].toString(),(UUID)r[5],
                r[6] != null?r[6].toString():null,r[7].toString(),((Number)r[8]).longValue(),
                ((Timestamp)r[9]).toInstant())).toList();
    }

    private Object[] latestRoundForUpdate(UUID offerId) {
        try {
            return (Object[]) entityManager.createNativeQuery("""
                    SELECT round_number,proposed_by FROM offer_rounds
                    WHERE offer_id=?1 AND status='OPEN' FOR UPDATE
                    """).setParameter(1, offerId).getSingleResult();
        } catch (NoResultException e) {
            throw DomainException.conflict("Offer round history is missing");
        }
    }

    private void closeOpenRound(UUID offerId, String status) {
        entityManager.createNativeQuery("UPDATE offer_rounds SET status=?2 WHERE offer_id=?1 AND status='OPEN'")
                .setParameter(1, offerId).setParameter(2, status).executeUpdate();
    }

    private void insertRound(OfferEntity offer, int number, String side, UUID userId, String message) {
        entityManager.createNativeQuery("""
                INSERT INTO offer_rounds(id,offer_id,round_number,amount,currency,proposed_by,
                  proposed_by_user_id,message,status,version,created_at)
                VALUES (?1,?2,?3,?4,?5,?6,?7,?8,'OPEN',0,NOW())
                """).setParameter(1, UUID.randomUUID()).setParameter(2, offer.getId()).setParameter(3, number)
                .setParameter(4, offer.getAmount()).setParameter(5, offer.getCurrency()).setParameter(6, side)
                .setParameter(7, userId).setParameter(8, message).executeUpdate();
    }

    @Transactional
    public OfferResponse reject(UUID offerId, UUID userId) {
        OfferEntity offer = offerRepository.findById(offerId)
                .orElseThrow(() -> DomainException.notFound("Offer not found"));

        LoadSnapshot load = requireLoad(offer.getLoadId());
        requireLoadManager(load, userId);
        if (offer.getStatus() != OfferStatus.PENDING) {
            throw DomainException.business("Only pending offers can be rejected");
        }

        offer.setStatus(OfferStatus.REJECTED);
        OfferEntity saved = offerRepository.save(offer);
        closeOpenRound(offerId, "REJECTED");

        eventPublisher.publish(new OfferRejectedEvent(
                saved.getId(),
                saved.getLoadId(),
                saved.getCreatedByUserId(),
                userId
        ));

        return toResponse(saved);
    }

    @Transactional
    public OfferResponse withdraw(UUID offerId, UUID userId) {
        OfferEntity offer = offerRepository.findByIdAndCreatedByUserId(offerId, userId)
                .orElseThrow(() -> DomainException.forbidden("Offer not found or access denied"));
        if (offer.getStatus() != OfferStatus.PENDING) {
            throw DomainException.business("Only pending offers can be withdrawn");
        }

        offer.setStatus(OfferStatus.WITHDRAWN);
        OfferEntity saved = offerRepository.save(offer);
        closeOpenRound(offerId, "WITHDRAWN");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OfferResponse> listMine(UUID userId) {
        return offerRepository.findByCreatedByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OfferResponse> listForLoad(UUID loadId, UUID userId) {
        LoadSnapshot load = requireLoad(loadId);
        requireLoadMember(load, userId);
        return offerRepository.findByLoadIdOrderByCreatedAtDesc(loadId).stream().map(this::toResponse).toList();
    }

    private void requireLoadMember(LoadSnapshot load, UUID userId) {
        if (load.createdByUserId().equals(userId)) return;
        Number membership = (Number) entityManager.createNativeQuery("""
                        SELECT COUNT(*) FROM company_members WHERE company_id = ?1 AND user_id = ?2
                        """).setParameter(1, load.shipperCompanyId()).setParameter(2, userId).getSingleResult();
        if (membership.longValue() == 0L) throw DomainException.forbidden("Load company access denied");
    }

    private void requireLoadManager(LoadSnapshot load, UUID userId) {
        if (load.createdByUserId().equals(userId)) return;
        Number membership = (Number) entityManager.createNativeQuery("""
                        SELECT COUNT(*) FROM company_members
                        WHERE company_id = ?1 AND user_id = ?2 AND member_role IN ('OWNER','ADMIN')
                        """)
                .setParameter(1, load.shipperCompanyId())
                .setParameter(2, userId)
                .getSingleResult();
        if (membership.longValue() == 0L) throw DomainException.forbidden("Only the load company can manage offers");
    }

    private UUID resolveOffererId(UUID userId, CreateOfferRequest request) {
        if (request.offererType() == OffererType.DRIVER) {
            try {
                return (UUID) entityManager.createNativeQuery("""
                                SELECT id FROM driver_profiles WHERE user_id = ?1
                                """)
                        .setParameter(1, userId)
                        .getSingleResult();
            } catch (NoResultException e) {
                // Independent drivers may offer before profile enrichment in MVP flows
                return userId;
            }
        }
        if (request.offererId() == null) {
            throw DomainException.business("Company offererId is required");
        }
        Number membership = (Number) entityManager.createNativeQuery("""
                        SELECT COUNT(*) FROM company_members WHERE company_id = ?1 AND user_id = ?2
                        """)
                .setParameter(1, request.offererId())
                .setParameter(2, userId)
                .getSingleResult();
        if (membership.longValue() == 0L) {
            throw DomainException.forbidden("You are not a member of the offering company");
        }
        return request.offererId();
    }

    private void requireIndependentOfferer(
            LoadSnapshot load, UUID userId, OffererType offererType, UUID offererId) {
        if (load.createdByUserId().equals(userId)) {
            throw DomainException.forbidden("Load owners cannot submit offers on their own loads");
        }
        if (offererType == OffererType.COMPANY && load.shipperCompanyId().equals(offererId)) {
            throw DomainException.forbidden("The shipper company cannot offer on its own load");
        }
        Number shipperMembership = (Number) entityManager.createNativeQuery("""
                        SELECT COUNT(*) FROM company_members /* shipper ownership check */
                        WHERE company_id = ?1 AND user_id = ?2
                        """)
                .setParameter(1, load.shipperCompanyId())
                .setParameter(2, userId)
                .getSingleResult();
        if (shipperMembership.longValue() > 0L) {
            throw DomainException.forbidden("Shipper company members cannot offer on their own load");
        }
    }

    private TransportAssignment resolveTransportAssignment(
            UUID userId, CreateOfferRequest request, UUID offererId) {
        Object[] vehicle;
        Object[] driver;
        try {
            vehicle = (Object[]) entityManager.createNativeQuery("""
                    SELECT id, owner_type, owner_id, plate, type, status
                    FROM vehicles WHERE id = ?1
                    """).setParameter(1, request.vehicleId()).getSingleResult();
        } catch (NoResultException e) {
            throw DomainException.notFound("Vehicle not found");
        }
        if (!"ACTIVE".equals(vehicle[5].toString())) {
            throw DomainException.business("Vehicle must be active");
        }
        boolean vehicleOwned = "USER".equals(vehicle[1].toString())
                ? userId.equals(vehicle[2])
                : isCompanyMember((UUID) vehicle[2], userId);
        if (!vehicleOwned || (request.offererType() == OffererType.COMPANY && !offererId.equals(vehicle[2]))) {
            throw DomainException.forbidden("Vehicle does not belong to the offering carrier");
        }

        try {
            driver = (Object[]) entityManager.createNativeQuery("""
                    SELECT d.id, d.user_id, d.company_id, d.status, u.email, u.phone
                    FROM driver_profiles d JOIN users u ON u.id = d.user_id
                    WHERE d.id = ?1
                    """).setParameter(1, request.driverProfileId()).getSingleResult();
        } catch (NoResultException e) {
            throw DomainException.notFound("Driver profile not found");
        }
        if (!"VERIFIED".equals(driver[3].toString())) {
            throw DomainException.business("Driver must be verified");
        }
        UUID driverCompanyId = (UUID) driver[2];
        boolean driverOwned = userId.equals(driver[1])
                || (driverCompanyId != null && isCompanyMember(driverCompanyId, userId));
        if (!driverOwned || (request.offererType() == OffererType.COMPANY && !offererId.equals(driverCompanyId))) {
            throw DomainException.forbidden("Driver does not belong to the offering carrier");
        }
        String email = driver[4].toString();
        String phone = driver[5] != null ? driver[5].toString() : "";
        return new TransportAssignment((UUID) vehicle[0], (UUID) driver[0], vehicle[3].toString(),
                vehicle[4].toString(), email.substring(0, email.indexOf('@')), phone);
    }

    private boolean isCompanyMember(UUID companyId, UUID userId) {
        Number count = (Number) entityManager.createNativeQuery("""
                SELECT COUNT(*) FROM company_members WHERE company_id = ?1 AND user_id = ?2
                """).setParameter(1, companyId).setParameter(2, userId).getSingleResult();
        return count.longValue() > 0L;
    }

    private LoadSnapshot requirePublishedLoad(UUID loadId) {
        LoadSnapshot load = requireLoad(loadId);
        if (!"PUBLISHED".equals(load.status())) {
            throw DomainException.business("Offers can only be submitted for published loads");
        }
        return load;
    }

    private LoadSnapshot requireLoad(UUID loadId) {
        try {
            Object[] row = (Object[]) entityManager.createNativeQuery("""
                            SELECT id, status, created_by_user_id, version, shipper_company_id
                            FROM loads
                            WHERE id = ?1
                            """)
                    .setParameter(1, loadId)
                    .getSingleResult();
            return new LoadSnapshot(
                    (UUID) row[0],
                    row[1].toString(),
                    (UUID) row[2],
                    ((Number) row[3]).longValue(),
                    (UUID) row[4]
            );
        } catch (NoResultException e) {
            throw DomainException.notFound("Load not found");
        }
    }

    private OfferResponse toResponse(OfferEntity offer) {
        return new OfferResponse(
                offer.getId(),
                offer.getLoadId(),
                offer.getOffererType(),
                offer.getOffererId(),
                offer.getCreatedByUserId(),
                offer.getAmount(),
                offer.getCurrency(),
                offer.getMessage(),
                offer.getVehicleId(),
                offer.getDriverProfileId(),
                offer.getVehiclePlate(),
                offer.getVehicleType(),
                offer.getDriverName(),
                offer.getDriverPhone(),
                offer.getEstimatedTransitHours(),
                offer.getAvailableAt(),
                offer.getStatus(),
                offer.getValidUntil(),
                offer.getVersion(),
                offer.getCreatedAt(),
                offer.getUpdatedAt()
        );
    }

    private record LoadSnapshot(UUID id, String status, UUID createdByUserId, long version, UUID shipperCompanyId) {
    }

    private record TransportAssignment(UUID vehicleId, UUID driverProfileId, String vehiclePlate,
                                       String vehicleType, String driverName, String driverPhone) {
    }
}
