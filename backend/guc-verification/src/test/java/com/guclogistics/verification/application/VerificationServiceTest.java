package com.guclogistics.verification.application;

import com.guclogistics.shared.event.DomainEventPublisher;
import com.guclogistics.shared.events.verification.VerificationApprovedEvent;
import com.guclogistics.shared.events.verification.VerificationRejectedEvent;
import com.guclogistics.shared.events.verification.VerificationSubmittedEvent;
import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.verification.application.dto.CreateVerificationApplicationRequest;
import com.guclogistics.verification.application.port.FileStoragePort;
import com.guclogistics.verification.application.port.VirusScanPort;
import com.guclogistics.verification.domain.ApplicationStatus;
import com.guclogistics.verification.domain.SubjectType;
import com.guclogistics.verification.infrastructure.persistence.VerificationApplicationEntity;
import com.guclogistics.verification.infrastructure.persistence.VerificationApplicationJpaRepository;
import com.guclogistics.verification.infrastructure.persistence.VerificationDocumentEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VerificationServiceTest {

    private static final byte[] PDF_BYTES = "%PDF-1.4\n%%EOF\n".getBytes();

    @Mock private VerificationApplicationJpaRepository repository;
    @Mock private FileStoragePort fileStoragePort;
    @Mock private VirusScanPort virusScanPort;
    @Mock private DomainEventPublisher eventPublisher;

    @InjectMocks
    private VerificationService verificationService;

    @Test
    void createApplicationStartsDraft() {
        UUID userId = UUID.randomUUID();
        UUID subjectId = UUID.randomUUID();
        when(repository.save(any(VerificationApplicationEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = verificationService.createApplication(userId,
                new CreateVerificationApplicationRequest(SubjectType.COMPANY, subjectId));

        assertThat(response.status()).isEqualTo(ApplicationStatus.DRAFT);
        assertThat(response.subjectId()).isEqualTo(subjectId);
    }

    @Test
    void uploadOnOthersApplicationForbidden() {
        UUID applicationId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();

        when(repository.findByIdAndApplicantUserId(applicationId, otherUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> verificationService.uploadDocument(applicationId, otherUserId, "ID", null))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("access denied");
    }

    @Test
    void uploadRejectsEmptyFile() {
        UUID applicationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        VerificationApplicationEntity application = draftApplication(applicationId, userId);
        MultipartFile file = mock(MultipartFile.class);

        when(repository.findByIdAndApplicantUserId(applicationId, userId)).thenReturn(Optional.of(application));
        when(file.isEmpty()).thenReturn(true);

        assertThatThrownBy(() -> verificationService.uploadDocument(applicationId, userId, "ID", file))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("required");
    }

    @Test
    void uploadRejectsOversizedFile() {
        UUID applicationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        VerificationApplicationEntity application = draftApplication(applicationId, userId);
        MultipartFile file = mock(MultipartFile.class);

        when(repository.findByIdAndApplicantUserId(applicationId, userId)).thenReturn(Optional.of(application));
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(6L * 1024 * 1024);

        assertThatThrownBy(() -> verificationService.uploadDocument(applicationId, userId, "ID", file))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("maximum size");
    }

    @Test
    void uploadRejectsFailedVirusScan() throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        VerificationApplicationEntity application = draftApplication(applicationId, userId);
        MultipartFile file = mockPdfFile();

        when(repository.findByIdAndApplicantUserId(applicationId, userId)).thenReturn(Optional.of(application));
        when(virusScanPort.scan(PDF_BYTES, "doc.pdf"))
                .thenReturn(new VirusScanPort.ScanResult(false, "malware"));

        assertThatThrownBy(() -> verificationService.uploadDocument(applicationId, userId, "ID", file))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("virus scan");
    }

    @Test
    void uploadRejectsUnsupportedMime() throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        VerificationApplicationEntity application = draftApplication(applicationId, userId);
        MultipartFile file = mock(MultipartFile.class);
        byte[] textBytes = "plain text".getBytes();

        when(repository.findByIdAndApplicantUserId(applicationId, userId)).thenReturn(Optional.of(application));
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn((long) textBytes.length);
        when(file.getBytes()).thenReturn(textBytes);
        when(file.getOriginalFilename()).thenReturn("notes.txt");
        when(virusScanPort.scan(textBytes, "notes.txt"))
                .thenReturn(new VirusScanPort.ScanResult(true, "clean"));

        assertThatThrownBy(() -> verificationService.uploadDocument(applicationId, userId, "ID", file))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Unsupported document type");
    }

    @Test
    void uploadStoresDocumentAndCallsPorts() throws Exception {
        UUID applicationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        VerificationApplicationEntity application = draftApplication(applicationId, userId);
        MultipartFile file = mockPdfFile();

        when(repository.findByIdAndApplicantUserId(applicationId, userId)).thenReturn(Optional.of(application));
        when(virusScanPort.scan(PDF_BYTES, "doc.pdf"))
                .thenReturn(new VirusScanPort.ScanResult(true, "clean"));
        when(repository.save(application)).thenReturn(application);

        var response = verificationService.uploadDocument(applicationId, userId, "LICENSE", file);

        assertThat(response.docType()).isEqualTo("LICENSE");
        assertThat(response.mime()).isEqualTo("application/pdf");
        verify(virusScanPort).scan(PDF_BYTES, "doc.pdf");
        verify(fileStoragePort).store(anyString(), any(), eq((long) PDF_BYTES.length), eq("application/pdf"));
    }

    @Test
    void submitWithoutDocumentsFails() {
        UUID applicationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        VerificationApplicationEntity application = draftApplication(applicationId, userId);

        when(repository.findByIdAndApplicantUserId(applicationId, userId)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> verificationService.submit(applicationId, userId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("At least one document");
    }

    @Test
    void submitPublishesEvent() {
        UUID applicationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        VerificationApplicationEntity application = draftApplication(applicationId, userId);
        application.getDocuments().add(new VerificationDocumentEntity());

        when(repository.findByIdAndApplicantUserId(applicationId, userId)).thenReturn(Optional.of(application));
        when(repository.save(application)).thenReturn(application);

        var response = verificationService.submit(applicationId, userId);

        assertThat(response.status()).isEqualTo(ApplicationStatus.SUBMITTED);
        verify(eventPublisher).publish(any(VerificationSubmittedEvent.class));
    }

    @Test
    void invalidStateTransitionFromDraftToApproved() {
        UUID applicationId = UUID.randomUUID();
        VerificationApplicationEntity application = draftApplication(applicationId, UUID.randomUUID());

        when(repository.findById(applicationId)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> verificationService.approve(applicationId, UUID.randomUUID()))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Invalid status transition");
    }

    @Test
    void approveSubmittedApplicationPublishesEvent() {
        UUID applicationId = UUID.randomUUID();
        UUID reviewerId = UUID.randomUUID();
        VerificationApplicationEntity application = submittedApplication(applicationId, UUID.randomUUID());

        when(repository.findById(applicationId)).thenReturn(Optional.of(application));
        when(repository.save(application)).thenReturn(application);

        var response = verificationService.approve(applicationId, reviewerId);

        assertThat(response.status()).isEqualTo(ApplicationStatus.APPROVED);
        ArgumentCaptor<VerificationApprovedEvent> captor = ArgumentCaptor.forClass(VerificationApprovedEvent.class);
        verify(eventPublisher).publish(captor.capture());
        assertThat(captor.getValue().reviewedByUserId()).isEqualTo(reviewerId);
    }

    @Test
    void rejectSubmittedApplicationPublishesEvent() {
        UUID applicationId = UUID.randomUUID();
        UUID reviewerId = UUID.randomUUID();
        VerificationApplicationEntity application = submittedApplication(applicationId, UUID.randomUUID());

        when(repository.findById(applicationId)).thenReturn(Optional.of(application));
        when(repository.save(application)).thenReturn(application);

        var response = verificationService.reject(applicationId, reviewerId, "invalid docs");

        assertThat(response.status()).isEqualTo(ApplicationStatus.REJECTED);
        assertThat(response.decisionReason()).isEqualTo("invalid docs");
        verify(eventPublisher).publish(any(VerificationRejectedEvent.class));
    }

    @Test
    void listMineReturnsApplications() {
        UUID userId = UUID.randomUUID();
        VerificationApplicationEntity application = draftApplication(UUID.randomUUID(), userId);
        when(repository.findByApplicantUserIdOrderByCreatedAtDesc(userId)).thenReturn(java.util.List.of(application));

        assertThat(verificationService.listMine(userId)).hasSize(1);
    }

    @Test
    void uploadOnNonDraftApplicationFails() {
        UUID applicationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        VerificationApplicationEntity application = submittedApplication(applicationId, userId);

        when(repository.findByIdAndApplicantUserId(applicationId, userId)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> verificationService.uploadDocument(applicationId, userId, "ID", mock(MultipartFile.class)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("draft applications");
    }

    private static VerificationApplicationEntity draftApplication(UUID id, UUID applicantId) {
        VerificationApplicationEntity application = new VerificationApplicationEntity();
        application.setId(id);
        application.setApplicantUserId(applicantId);
        application.setSubjectType(SubjectType.COMPANY);
        application.setSubjectId(UUID.randomUUID());
        application.setStatus(ApplicationStatus.DRAFT);
        return application;
    }

    private static VerificationApplicationEntity submittedApplication(UUID id, UUID applicantId) {
        VerificationApplicationEntity application = draftApplication(id, applicantId);
        application.setStatus(ApplicationStatus.SUBMITTED);
        return application;
    }

    private static MultipartFile mockPdfFile() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn((long) PDF_BYTES.length);
        when(file.getBytes()).thenReturn(PDF_BYTES);
        when(file.getOriginalFilename()).thenReturn("doc.pdf");
        return file;
    }
}
