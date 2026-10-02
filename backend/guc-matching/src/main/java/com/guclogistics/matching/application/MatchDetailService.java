package com.guclogistics.matching.application;

import com.guclogistics.matching.application.dto.MatchDetailResponse;
import com.guclogistics.matching.application.dto.ShipmentResponse;
import com.guclogistics.shared.exception.DomainException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MatchDetailService {
    private final EntityManager entityManager;
    private final ShipmentService shipmentService;

    @Transactional(readOnly = true)
    public MatchDetailResponse get(UUID matchId, UUID userId) {
        Object[] r;
        try {
            r = (Object[]) entityManager.createNativeQuery("""
                SELECT m.id,m.status,m.load_id,m.offer_id,l.title,l.pickup_city,l.pickup_country,
                  l.dropoff_city,l.dropoff_country,o.amount,o.currency,l.shipper_company_id,
                  sc.legal_name,CASE WHEN o.offerer_type='COMPANY' THEN o.offerer_id END,
                  cc.legal_name,o.vehicle_id,o.vehicle_plate,o.vehicle_type,
                  o.driver_profile_id,o.driver_name,l.contact_phone,o.driver_phone,m.matched_at,m.created_at
                FROM matches m JOIN loads l ON l.id=m.load_id JOIN offers o ON o.id=m.offer_id
                JOIN companies sc ON sc.id=l.shipper_company_id
                LEFT JOIN companies cc ON o.offerer_type='COMPANY' AND cc.id=o.offerer_id
                WHERE m.id=?1 AND (l.created_by_user_id=?2 OR o.created_by_user_id=?2
                  OR EXISTS (SELECT 1 FROM company_members cm WHERE cm.user_id=?2
                    AND (cm.company_id=l.shipper_company_id OR
                      (o.offerer_type='COMPANY' AND cm.company_id=o.offerer_id))))
                """).setParameter(1, matchId).setParameter(2, userId).getSingleResult();
        } catch (NoResultException e) {
            throw DomainException.forbidden("Match not found or access denied");
        }
        ShipmentResponse shipment = shipmentService.getForMatch(matchId, userId);
        return new MatchDetailResponse((UUID)r[0],r[1].toString(),(UUID)r[2],(UUID)r[3],r[4].toString(),
                r[5].toString(),r[6].toString(),r[7].toString(),r[8].toString(),(BigDecimal)r[9],r[10].toString(),
                (UUID)r[11],r[12].toString(),(UUID)r[13],r[14] != null?r[14].toString():"Independent carrier",
                (UUID)r[15],r[16].toString(),r[17].toString(),(UUID)r[18],r[19].toString(),
                r[20] != null?r[20].toString():null,r[21] != null?r[21].toString():null,shipment,
                ((Timestamp)r[22]).toInstant(),((Timestamp)r[23]).toInstant());
    }
}
