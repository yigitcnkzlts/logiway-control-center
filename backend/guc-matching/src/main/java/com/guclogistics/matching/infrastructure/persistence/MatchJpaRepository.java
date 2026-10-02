package com.guclogistics.matching.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MatchJpaRepository extends JpaRepository<MatchEntity, UUID> {

    @Query(value = """
            SELECT m.* FROM matches m
            INNER JOIN loads l ON l.id = m.load_id
            INNER JOIN offers o ON o.id = m.offer_id
            WHERE l.created_by_user_id = :userId OR o.created_by_user_id = :userId
              OR EXISTS (SELECT 1 FROM company_members cm WHERE cm.user_id=:userId
                AND (cm.company_id=l.shipper_company_id OR
                  (o.offerer_type='COMPANY' AND cm.company_id=o.offerer_id)))
            ORDER BY m.matched_at DESC
            """, nativeQuery = true)
    List<MatchEntity> findForUser(@Param("userId") UUID userId);
}
