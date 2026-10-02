package com.guclogistics.notifications.application;

import com.guclogistics.notifications.infrastructure.persistence.NotificationEntity;
import com.guclogistics.notifications.infrastructure.persistence.NotificationJpaRepository;
import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.shared.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationJpaRepository repository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void notifyPersistsNotification() {
        UUID userId = UUID.randomUUID();

        notificationService.notify(userId, "TEST", "Title", "Body", Map.of("k", "v"));

        verify(repository).save(any(NotificationEntity.class));
    }

    @Test
    void notifyWithNullPayloadUsesEmptyMap() {
        UUID userId = UUID.randomUUID();

        notificationService.notify(userId, "TEST", "Title", "Body", null);

        verify(repository).save(any(NotificationEntity.class));
    }

    @Test
    void listReturnsUserNotifications() {
        UUID userId = UUID.randomUUID();
        AuthenticatedUser user = user(userId);
        NotificationEntity entity = entity(userId);
        Page<NotificationEntity> page = new PageImpl<>(List.of(entity));

        when(repository.findByUserIdOrderByCreatedAtDesc(eq(userId), any(Pageable.class))).thenReturn(page);

        assertThat(notificationService.list(user, 0, 20).content()).hasSize(1);
    }

    @Test
    void markReadSuccess() {
        UUID notificationId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        AuthenticatedUser owner = user(ownerId);
        NotificationEntity entity = entity(ownerId);
        entity.setId(notificationId);

        when(repository.findById(notificationId)).thenReturn(Optional.of(entity));

        notificationService.markRead(owner, notificationId);

        assertThat(entity.getReadAt()).isNotNull();
        verify(repository).save(entity);
    }

    @Test
    void markReadWrongUserForbidden() {
        UUID notificationId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        AuthenticatedUser otherUser = user(UUID.randomUUID());

        NotificationEntity entity = entity(ownerId);
        entity.setId(notificationId);

        when(repository.findById(notificationId)).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> notificationService.markRead(otherUser, notificationId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Cannot access");
    }

    @Test
    void markReadNotFound() {
        UUID notificationId = UUID.randomUUID();
        when(repository.findById(notificationId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markRead(user(UUID.randomUUID()), notificationId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Notification not found");
    }

    private static AuthenticatedUser user(UUID userId) {
        return new AuthenticatedUser(userId, UUID.randomUUID(), "user@example.com", Set.of("SHIPPER"), true);
    }

    private static NotificationEntity entity(UUID userId) {
        NotificationEntity entity = new NotificationEntity();
        entity.setUserId(userId);
        entity.setType("TEST");
        entity.setTitle("Hello");
        entity.setBody("World");
        return entity;
    }
}
