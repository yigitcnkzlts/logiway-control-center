package com.guclogistics.matching.application;

import com.guclogistics.matching.application.dto.ChatMessageResponse;
import com.guclogistics.matching.infrastructure.persistence.MatchMessageEntity;
import com.guclogistics.matching.infrastructure.persistence.MatchMessageJpaRepository;
import com.guclogistics.shared.exception.DomainException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MatchChatService {
    private final MatchMessageJpaRepository repository;
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> list(UUID matchId, UUID userId) {
        requireParticipantRole(matchId, userId);
        return repository.findByMatchIdOrderByCreatedAtAsc(matchId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public ChatMessageResponse send(UUID matchId, UUID userId, String body) {
        String role = requireParticipantRole(matchId, userId);
        MatchMessageEntity message = new MatchMessageEntity();
        message.setMatchId(matchId);
        message.setSenderUserId(userId);
        message.setSenderRole(role);
        message.setBody(body.trim());
        return toResponse(repository.save(message));
    }

    private String requireParticipantRole(UUID matchId, UUID userId) {
        try {
            Object role = entityManager.createNativeQuery("""
                SELECT CASE
                  WHEN l.created_by_user_id=?2 OR EXISTS (
                    SELECT 1 FROM company_members cm WHERE cm.user_id=?2 AND cm.company_id=l.shipper_company_id
                  ) THEN 'SHIPPER'
                  WHEN EXISTS (
                    SELECT 1 FROM driver_profiles dp WHERE dp.id=o.driver_profile_id AND dp.user_id=?2
                  ) THEN 'DRIVER'
                  WHEN o.created_by_user_id=?2 OR EXISTS (
                    SELECT 1 FROM company_members cm WHERE cm.user_id=?2
                      AND o.offerer_type='COMPANY' AND cm.company_id=o.offerer_id
                  ) THEN 'CARRIER'
                  ELSE NULL END
                FROM matches m JOIN loads l ON l.id=m.load_id JOIN offers o ON o.id=m.offer_id
                WHERE m.id=?1
                """).setParameter(1, matchId).setParameter(2, userId).getSingleResult();
            if (role == null) throw DomainException.forbidden("Match not found or chat access denied");
            return role.toString();
        } catch (NoResultException e) {
            throw DomainException.forbidden("Match not found or chat access denied");
        }
    }

    private ChatMessageResponse toResponse(MatchMessageEntity message) {
        return new ChatMessageResponse(message.getId(), message.getMatchId(), message.getSenderUserId(),
                message.getSenderRole(), message.getBody(), message.getCreatedAt());
    }
}
