package com.guclogistics.audit.application;

import com.guclogistics.audit.infrastructure.persistence.AuditLogEntity;
import com.guclogistics.audit.infrastructure.persistence.AuditLogJpaRepository;
import com.guclogistics.shared.web.CorrelationIdFilter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock private AuditLogJpaRepository repository;

    @InjectMocks
    private AuditService auditService;

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    void recordPersistsAuditLogWithCorrelationId() {
        UUID actorId = UUID.randomUUID();
        MDC.put(CorrelationIdFilter.MDC_KEY, "corr-123");

        auditService.record(actorId, "TEST_ACTION", "Entity", "entity-1", Map.of("key", "value"));

        ArgumentCaptor<AuditLogEntity> captor = ArgumentCaptor.forClass(AuditLogEntity.class);
        verify(repository).save(captor.capture());
        AuditLogEntity saved = captor.getValue();
        assertThat(saved.getActorUserId()).isEqualTo(actorId);
        assertThat(saved.getAction()).isEqualTo("TEST_ACTION");
        assertThat(saved.getCorrelationId()).isEqualTo("corr-123");
    }

    @Test
    void recordWithNullMetadataUsesEmptyMap() {
        auditService.record(UUID.randomUUID(), "ACTION", "Entity", "id", null);

        verify(repository).save(any(AuditLogEntity.class));
    }
}
