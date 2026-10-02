package com.guclogistics.verification.application;

import com.guclogistics.shared.event.DomainEventPublisher;
import com.guclogistics.shared.events.verification.VerificationApprovedEvent;
import com.guclogistics.shared.events.verification.VerificationRejectedEvent;
import com.guclogistics.shared.events.verification.VerificationSubmittedEvent;
import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.verification.application.dto.CreateVerificationApplicationRequest;
import com.guclogistics.verification.application.dto.VerificationApplicationResponse;
import com.guclogistics.verification.application.dto.VerificationDocumentResponse;
import com.guclogistics.verification.application.port.FileStoragePort;
import com.guclogistics.verification.application.port.VirusScanPort;
import com.guclogistics.verification.domain.ApplicationStatus;
import com.guclogistics.verification.infrastructure.persistence.VerificationApplicationEntity;
import com.guclogistics.verification.infrastructure.persistence.VerificationApplicationJpaRepository;
import com.guclogistics.verification.infrastructure.persistence.VerificationDocumentEntity;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_MIMES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png"
    );

    private final VerificationApplicationJpaRepository repository;
    private final FileStoragePort fileStoragePort;
    private final VirusScanPort virusScanPort;
    private final DomainEventPublisher eventPublisher;
    private final Tika tika = new Tika();

    @Transactional
    public VerificationApplicationResponse createApplication(UUID userId, CreateVerificationApplicationRequest request) {
        VerificationApplicationEntity application = new VerificationApplicationEntity();
        application.setSubjectType(request.subjectType());
        application.setSubjectId(request.subjectId());
        application.setApplicantUserId(userId);
        application.setStatus(ApplicationStatus.DRAFT);
        return toResponse(repository.save(application));
    }

    @Transactional
    public VerificationDocumentResponse uploadDocument(
            UUID applicationId,
            UUID userId,
            String docType,
            MultipartFile file
    ) {
        VerificationApplicationEntity application = requireOwnedDraft(applicationId, userId);

        if (file == null || file.isEmpty()) {
            throw DomainException.business("Document file is required");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw DomainException.business("Document exceeds maximum size of 5MB");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw DomainException.business("Failed to read uploaded file");
        }

        VirusScanPort.ScanResult scanResult = virusScanPort.scan(bytes, file.getOriginalFilename());
        if (!scanResult.clean()) {
            throw DomainException.business("Document failed virus scan: " + scanResult.message());
        }

        String detectedMime = detectMime(bytes, file.getOriginalFilename());
        if (!ALLOWED_MIMES.contains(detectedMime)) {
            throw DomainException.business("Unsupported document type: " + detectedMime);
        }

        String checksum = sha256(bytes);
        String storageKey = "verification/" + applicationId + "/" + UUID.randomUUID();

        fileStoragePort.store(
                storageKey,
                new java.io.ByteArrayInputStream(bytes),
                bytes.length,
                detectedMime
        );

        VerificationDocumentEntity document = new VerificationDocumentEntity();
        document.setApplication(application);
        document.setDocType(docType);
        document.setStorageKey(storageKey);
        document.setMime(detectedMime);
        document.setSizeBytes(file.getSize());
        document.setChecksumSha256(checksum);
        application.getDocuments().add(document);

        repository.save(application);
        return toDocumentResponse(document);
    }

    @Transactional
    public VerificationApplicationResponse submit(UUID applicationId, UUID userId) {
        VerificationApplicationEntity application = requireOwnedDraft(applicationId, userId);
        if (application.getDocuments().isEmpty()) {
            throw DomainException.business("At least one document is required to submit");
        }
        transition(application, ApplicationStatus.SUBMITTED);
        application.setSubmittedAt(java.time.Instant.now());
        repository.save(application);

        eventPublisher.publish(new VerificationSubmittedEvent(
                application.getId(),
                application.getSubjectType().name(),
                application.getSubjectId(),
                application.getApplicantUserId()
        ));

        return toResponse(application);
    }

    @Transactional(readOnly = true)
    public List<VerificationApplicationResponse> listMine(UUID userId) {
        return repository.findByApplicantUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public VerificationApplicationResponse approve(UUID applicationId, UUID reviewerUserId) {
        VerificationApplicationEntity application = repository.findById(applicationId)
                .orElseThrow(() -> DomainException.notFound("Verification application not found"));
        transition(application, ApplicationStatus.APPROVED);
        application.setReviewedBy(reviewerUserId);
        application.setDecisionReason(null);
        repository.save(application);

        eventPublisher.publish(new VerificationApprovedEvent(
                application.getId(),
                application.getSubjectType().name(),
                application.getSubjectId(),
                application.getApplicantUserId(),
                reviewerUserId
        ));

        return toResponse(application);
    }

    @Transactional
    public VerificationApplicationResponse reject(UUID applicationId, UUID reviewerUserId, String reason) {
        VerificationApplicationEntity application = repository.findById(applicationId)
                .orElseThrow(() -> DomainException.notFound("Verification application not found"));
        transition(application, ApplicationStatus.REJECTED);
        application.setReviewedBy(reviewerUserId);
        application.setDecisionReason(reason);
        repository.save(application);

        eventPublisher.publish(new VerificationRejectedEvent(
                application.getId(),
                application.getSubjectType().name(),
                application.getSubjectId(),
                application.getApplicantUserId(),
                reviewerUserId,
                reason
        ));

        return toResponse(application);
    }

    private VerificationApplicationEntity requireOwnedDraft(UUID applicationId, UUID userId) {
        VerificationApplicationEntity application = repository.findByIdAndApplicantUserId(applicationId, userId)
                .orElseThrow(() -> DomainException.forbidden("Application not found or access denied"));
        if (application.getStatus() != ApplicationStatus.DRAFT) {
            throw DomainException.business("Documents can only be added to draft applications");
        }
        return application;
    }

    private void transition(VerificationApplicationEntity application, ApplicationStatus target) {
        ApplicationStatus current = application.getStatus();
        boolean valid = switch (target) {
            case SUBMITTED -> current == ApplicationStatus.DRAFT;
            case APPROVED, REJECTED -> current == ApplicationStatus.SUBMITTED;
            default -> false;
        };
        if (!valid) {
            throw DomainException.business(
                    "Invalid status transition from " + current + " to " + target
            );
        }
        application.setStatus(target);
    }

    private String detectMime(byte[] bytes, String fileName) {
        try {
            return tika.detect(bytes, fileName);
        } catch (Exception e) {
            throw DomainException.business("Unable to detect document type");
        }
    }

    private static String sha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private VerificationApplicationResponse toResponse(VerificationApplicationEntity application) {
        List<VerificationDocumentResponse> docs = application.getDocuments().stream()
                .map(this::toDocumentResponse)
                .toList();
        return new VerificationApplicationResponse(
                application.getId(),
                application.getSubjectType(),
                application.getSubjectId(),
                application.getStatus(),
                application.getSubmittedAt(),
                application.getReviewedBy(),
                application.getDecisionReason(),
                application.getApplicantUserId(),
                docs,
                application.getCreatedAt(),
                application.getUpdatedAt()
        );
    }

    private VerificationDocumentResponse toDocumentResponse(VerificationDocumentEntity document) {
        return new VerificationDocumentResponse(
                document.getId(),
                document.getDocType(),
                document.getMime(),
                document.getSizeBytes(),
                document.getChecksumSha256(),
                document.getCreatedAt()
        );
    }
}
