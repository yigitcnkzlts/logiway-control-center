package com.guclogistics.notifications.application;

import com.guclogistics.identity.infrastructure.persistence.UserEntity;
import com.guclogistics.identity.infrastructure.persistence.UserJpaRepository;
import com.guclogistics.shared.events.matching.MatchCreatedEvent;
import com.guclogistics.shared.events.offers.OfferSubmittedEvent;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchEmailNotificationListenerTest {
    @Mock JavaMailSender mailSender;
    @Mock UserJpaRepository users;
    @Mock EntityManager entityManager;
    @Mock Query query;

    private MatchEmailNotificationListener listener;

    @BeforeEach
    void setUp() {
        listener = new MatchEmailNotificationListener(mailSender, users, entityManager);
        ReflectionTestUtils.setField(listener, "from", "bildirim@logiway.example");
    }

    @Test
    void matchCreatedEmailsBothParties() {
        UUID ownerId = UUID.randomUUID();
        UUID carrierId = UUID.randomUUID();
        when(users.findById(ownerId)).thenReturn(Optional.of(user(ownerId, "owner@example.com")));
        when(users.findById(carrierId)).thenReturn(Optional.of(user(carrierId, "carrier@example.com")));

        listener.onMatchCreated(new MatchCreatedEvent(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), ownerId, carrierId));

        ArgumentCaptor<SimpleMailMessage> messages = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(2)).send(messages.capture());
        assertThat(messages.getAllValues())
                .extracting(message -> message.getTo()[0], SimpleMailMessage::getSubject)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("owner@example.com", "Yükünüz için eşleşme oluştu"),
                        org.assertj.core.groups.Tuple.tuple("carrier@example.com", "Teklifiniz eşleşti"));
        assertThat(messages.getAllValues()).allSatisfy(message -> {
            assertThat(message.getFrom()).isEqualTo("bildirim@logiway.example");
            assertThat(message.getText()).contains("Logiway");
        });
    }

    @Test
    void offerSubmittedEmailsResolvedLoadOwner() {
        UUID loadId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        when(entityManager.createNativeQuery(any(String.class))).thenReturn(query);
        when(query.setParameter(1, loadId)).thenReturn(query);
        when(query.getSingleResult()).thenReturn(ownerId);
        when(users.findById(ownerId)).thenReturn(Optional.of(user(ownerId, "owner@example.com")));

        listener.onOfferSubmitted(offer(loadId));

        ArgumentCaptor<SimpleMailMessage> message = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(message.capture());
        assertThat(message.getValue().getTo()).containsExactly("owner@example.com");
        assertThat(message.getValue().getSubject()).isEqualTo("Yük ilanınıza yeni teklif geldi");
    }

    @Test
    void missingLoadOrUsersDoNotSendEmail() {
        UUID missingLoadId = UUID.randomUUID();
        when(entityManager.createNativeQuery(any(String.class))).thenReturn(query);
        when(query.setParameter(1, missingLoadId)).thenReturn(query);
        when(query.getSingleResult()).thenThrow(NoResultException.class);

        listener.onOfferSubmitted(offer(missingLoadId));
        listener.onMatchCreated(new MatchCreatedEvent(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()));

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void mailProviderFailureDoesNotBreakBusinessFlow() {
        UUID ownerId = UUID.randomUUID();
        when(users.findById(ownerId)).thenReturn(Optional.of(user(ownerId, "owner@example.com")));
        doThrow(new IllegalStateException("SMTP unavailable"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        listener.onMatchCreated(new MatchCreatedEvent(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), ownerId, UUID.randomUUID()));

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    private static UserEntity user(UUID id, String email) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setEmail(email);
        return user;
    }

    private static OfferSubmittedEvent offer(UUID loadId) {
        return new OfferSubmittedEvent(
                UUID.randomUUID(), loadId, "DRIVER", UUID.randomUUID(), UUID.randomUUID(),
                BigDecimal.valueOf(1200), "TRY");
    }
}
