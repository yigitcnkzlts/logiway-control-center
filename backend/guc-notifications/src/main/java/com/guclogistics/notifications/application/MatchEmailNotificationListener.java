package com.guclogistics.notifications.application;

import com.guclogistics.identity.infrastructure.persistence.UserJpaRepository;
import com.guclogistics.shared.events.matching.MatchCreatedEvent;
import com.guclogistics.shared.events.offers.OfferSubmittedEvent;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "guc.notifications.email.enabled", havingValue = "true")
@Slf4j
public class MatchEmailNotificationListener {
    private final JavaMailSender mailSender;
    private final UserJpaRepository users;
    private final EntityManager entityManager;

    @Value("${guc.notifications.email.from}")
    private String from;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onMatchCreated(MatchCreatedEvent event) {
        send(event.loadOwnerUserId(), "Yükünüz için eşleşme oluştu",
                "Yükünüz için uygun taşıyıcıyla eşleşme tamamlandı. Logiway'e girerek iletişim bilgilerini ve güvenli sohbeti açabilirsiniz.");
        send(event.offerCreatedByUserId(), "Teklifiniz eşleşti",
                "Teklifiniz kabul edildi ve eşleşme oluşturuldu. Logiway'e girerek iletişim bilgilerini ve güvenli sohbeti açabilirsiniz.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOfferSubmitted(OfferSubmittedEvent event) {
        try {
            UUID loadOwnerUserId = (UUID) entityManager.createNativeQuery(
                    "SELECT created_by_user_id FROM loads WHERE id=?1")
                    .setParameter(1, event.loadId())
                    .getSingleResult();
            send(loadOwnerUserId, "Yük ilanınıza yeni teklif geldi",
                    "Yük ilanınıza yeni bir taşıma teklifi gönderildi. Teklifi incelemek için Logiway'e giriş yapabilirsiniz.");
        } catch (NoResultException ignored) {
            log.warn("Offer email recipient could not be resolved for load {}", event.loadId());
        }
    }

    private void send(UUID userId, String subject, String body) {
        users.findById(userId).ifPresent(user -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(from);
                message.setTo(user.getEmail());
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
            } catch (RuntimeException error) {
                log.error("Match notification email could not be sent for user {}", userId, error);
            }
        });
    }
}
