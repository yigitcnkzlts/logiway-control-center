package com.guclogistics.audit.application;

import com.guclogistics.audit.infrastructure.persistence.AuditLogEntity;
import com.guclogistics.audit.infrastructure.persistence.AuditLogJpaRepository;
import com.guclogistics.shared.web.CorrelationIdFilter;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogJpaRepository repository;

    @Transactional
    public void record(UUID actorUserId, String action, String entityType, String entityId, Map<String, Object> metadata) {
        AuditLogEntity log = new AuditLogEntity();
        log.setActorUserId(actorUserId);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setMetadataJson(metadata != null ? metadata : Map.of());
        log.setCorrelationId(MDC.get(CorrelationIdFilter.MDC_KEY));
        repository.save(log);
    }
}
