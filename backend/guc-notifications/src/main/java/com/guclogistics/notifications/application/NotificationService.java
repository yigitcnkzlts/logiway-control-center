package com.guclogistics.notifications.application;

import com.guclogistics.notifications.infrastructure.persistence.NotificationEntity;
import com.guclogistics.notifications.infrastructure.persistence.NotificationJpaRepository;
import com.guclogistics.shared.api.PageResponse;
import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.shared.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationJpaRepository repository;

    @Transactional
    public void notify(UUID userId, String type, String title, String body, Map<String, Object> payload) {
        NotificationEntity entity = new NotificationEntity();
        entity.setUserId(userId);
        entity.setType(type);
        entity.setTitle(title);
        entity.setBody(body);
        entity.setPayloadJson(payload != null ? payload : Map.of());
        repository.save(entity);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationEntity> list(AuthenticatedUser user, int page, int size) {
        return PageResponse.from(repository.findByUserIdOrderByCreatedAtDesc(user.userId(), PageRequest.of(page, size)));
    }

    @Transactional
    public void markRead(AuthenticatedUser user, UUID id) {
        NotificationEntity entity = repository.findById(id)
                .orElseThrow(() -> DomainException.notFound("Notification not found"));
        if (!entity.getUserId().equals(user.userId())) {
            throw DomainException.forbidden("Cannot access this notification");
        }
        entity.setReadAt(Instant.now());
        repository.save(entity);
    }
}
