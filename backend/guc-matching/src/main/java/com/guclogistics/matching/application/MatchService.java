package com.guclogistics.matching.application;

import com.guclogistics.matching.application.dto.MatchResponse;
import com.guclogistics.matching.domain.MatchStatus;
import com.guclogistics.matching.infrastructure.persistence.MatchEntity;
import com.guclogistics.matching.infrastructure.persistence.MatchJpaRepository;
import com.guclogistics.shared.event.DomainEventPublisher;
import com.guclogistics.shared.events.matching.MatchCreatedEvent;
import com.guclogistics.shared.events.offers.OfferAcceptedEvent;
import com.guclogistics.shared.exception.DomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchJpaRepository matchRepository;
    private final DomainEventPublisher eventPublisher;
    private final ShipmentService shipmentService;

    @Transactional(readOnly = true)
    public List<MatchResponse> listForUser(UUID userId) {
        return matchRepository.findForUser(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MatchResponse createFromAcceptedOffer(OfferAcceptedEvent event) {
        MatchEntity match = new MatchEntity();
        match.setLoadId(event.loadId());
        match.setOfferId(event.offerId());
        match.setStatus(MatchStatus.ACTIVE);

        MatchEntity saved;
        try {
            saved = matchRepository.save(match);
            shipmentService.createForMatch(saved.getId(), saved.getLoadId(), saved.getOfferId());
        } catch (DataIntegrityViolationException e) {
            throw DomainException.conflict("Match already exists for this load or offer");
        }

        eventPublisher.publish(new MatchCreatedEvent(
                saved.getId(),
                saved.getLoadId(),
                saved.getOfferId(),
                event.loadOwnerUserId(),
                event.offerCreatedByUserId()
        ));

        return toResponse(saved);
    }

    private MatchResponse toResponse(MatchEntity match) {
        return new MatchResponse(
                match.getId(),
                match.getLoadId(),
                match.getOfferId(),
                match.getStatus(),
                match.getMatchedAt(),
                match.getCreatedAt()
        );
    }
}
