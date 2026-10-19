package com.guclogistics.matching.application;

import com.guclogistics.matching.infrastructure.persistence.MatchMessageEntity;
import com.guclogistics.matching.infrastructure.persistence.MatchMessageJpaRepository;
import com.guclogistics.shared.exception.DomainException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.Query;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchChatServiceTest {
    @Mock MatchMessageJpaRepository repository;
    @Mock EntityManager entityManager;
    @InjectMocks MatchChatService service;

    @Test
    void derivesSenderRoleAndTrimsMessage() {
        Query query = mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyInt(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn("DRIVER");
        when(repository.save(any())).thenAnswer(invocation -> {
            MatchMessageEntity message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            message.setCreatedAt(java.time.Instant.now());
            return message;
        });

        var result = service.send(UUID.randomUUID(), UUID.randomUUID(), "  Merhaba  ");

        assertThat(result.senderRole()).isEqualTo("DRIVER");
        assertThat(result.body()).isEqualTo("Merhaba");
    }

    @Test
    void rejectsNonParticipant() {
        Query query = mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyInt(), any())).thenReturn(query);
        when(query.getSingleResult()).thenThrow(new NoResultException());

        assertThatThrownBy(() -> service.list(UUID.randomUUID(), UUID.randomUUID()))
                .isInstanceOf(DomainException.class).hasMessageContaining("access denied");
        verifyNoInteractions(repository);
    }
}
