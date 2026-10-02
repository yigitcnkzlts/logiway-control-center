package com.guclogistics.matching.application;

import com.guclogistics.matching.infrastructure.persistence.MatchEntity;
import com.guclogistics.matching.infrastructure.persistence.MatchJpaRepository;
import com.guclogistics.shared.event.DomainEventPublisher;
import com.guclogistics.shared.events.matching.MatchCreatedEvent;
import com.guclogistics.shared.events.offers.OfferAcceptedEvent;
import com.guclogistics.shared.exception.DomainException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchServiceTest {

    @Mock
    MatchJpaRepository matchRepository;
    @Mock
    DomainEventPublisher eventPublisher;
    @Mock
    ShipmentService shipmentService;
    @InjectMocks
    MatchService matchService;

    @Test
    void createFromAcceptedOfferPersistsAndPublishes() {
        UUID offerId = UUID.randomUUID();
        UUID loadId = UUID.randomUUID();
        UUID owner = UUID.randomUUID();
        UUID offererUser = UUID.randomUUID();
        when(matchRepository.save(any(MatchEntity.class))).thenAnswer(inv -> {
            MatchEntity m = inv.getArgument(0);
            m.setId(UUID.randomUUID());
            return m;
        });

        matchService.createFromAcceptedOffer(new OfferAcceptedEvent(
                offerId, loadId, owner, "DRIVER", UUID.randomUUID(), offererUser
        ));

        verify(matchRepository).save(any(MatchEntity.class));
        verify(shipmentService).createForMatch(any(), eq(loadId), eq(offerId));
        ArgumentCaptor<MatchCreatedEvent> captor = ArgumentCaptor.forClass(MatchCreatedEvent.class);
        verify(eventPublisher).publish(captor.capture());
        assertThat(captor.getValue().loadId()).isEqualTo(loadId);
        assertThat(captor.getValue().offerId()).isEqualTo(offerId);
    }

    @Test
    void createFromAcceptedOfferConflictWhenDuplicate() {
        when(matchRepository.save(any(MatchEntity.class)))
                .thenThrow(new DataIntegrityViolationException("dup"));

        assertThatThrownBy(() -> matchService.createFromAcceptedOffer(new OfferAcceptedEvent(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "DRIVER",
                UUID.randomUUID(), UUID.randomUUID()
        ))).isInstanceOf(DomainException.class)
                .extracting("errorCode")
                .isEqualTo(com.guclogistics.shared.exception.ErrorCode.CONFLICT);
    }

    @Test
    void listForUserMapsRepositoryResults() {
        UUID userId = UUID.randomUUID();
        MatchEntity entity = new MatchEntity();
        entity.setId(UUID.randomUUID());
        entity.setLoadId(UUID.randomUUID());
        entity.setOfferId(UUID.randomUUID());
        when(matchRepository.findForUser(userId)).thenReturn(List.of(entity));

        assertThat(matchService.listForUser(userId)).hasSize(1);
    }
}
