package com.guclogistics.offers.infrastructure.persistence;

import com.guclogistics.offers.domain.OfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OfferJpaRepository extends JpaRepository<OfferEntity, UUID> {

    List<OfferEntity> findByCreatedByUserIdOrderByCreatedAtDesc(UUID createdByUserId);

    List<OfferEntity> findByLoadIdAndStatus(UUID loadId, OfferStatus status);

    List<OfferEntity> findByLoadIdOrderByCreatedAtDesc(UUID loadId);

    Optional<OfferEntity> findByIdAndCreatedByUserId(UUID id, UUID createdByUserId);

    @Modifying
    @Query("""
            UPDATE OfferEntity o SET o.status = com.guclogistics.offers.domain.OfferStatus.REJECTED
            WHERE o.loadId = :loadId AND o.status = com.guclogistics.offers.domain.OfferStatus.PENDING
            AND o.id <> :acceptedOfferId
            """)
    int rejectOtherPendingOffers(@Param("loadId") UUID loadId, @Param("acceptedOfferId") UUID acceptedOfferId);
}
