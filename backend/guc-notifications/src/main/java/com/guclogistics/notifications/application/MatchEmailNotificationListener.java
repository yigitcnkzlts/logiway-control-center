package com.guclogistics.notifications.application;

import com.guclogistics.identity.infrastructure.persistence.UserJpaRepository;
import com.guclogistics.shared.events.matching.MatchCreatedEvent;
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

    @Value("${guc.notifications.email.from}")
    private String from;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onMatchCreated(MatchCreatedEvent event) {
        send(event.loadOwnerUserId(), "Yükünüz için eşleşme oluştu",
                "Yükünüz için uygun taşıyıcıyla eşleşme tamamlandı. Logiway'e girerek iletişim bilgilerini ve güvenli sohbeti açabilirsiniz.");
        send(event.offerCreatedByUserId(), "Teklifiniz eşleşti",
                "Teklifiniz kabul edildi ve eşleşme oluşturuldu. Logiway'e girerek iletişim bilgilerini ve güvenli sohbeti açabilirsiniz.");
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
