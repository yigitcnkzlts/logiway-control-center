package com.guclogistics.verification.api;

import com.guclogistics.shared.security.AuthenticatedUser;
import com.guclogistics.shared.security.RoleNames;
import com.guclogistics.verification.application.VerificationService;
import com.guclogistics.verification.application.dto.CreateVerificationApplicationRequest;
import com.guclogistics.verification.application.dto.RejectVerificationRequest;
import com.guclogistics.verification.application.dto.VerificationApplicationResponse;
import com.guclogistics.verification.application.dto.VerificationDocumentResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/verification/applications")
@Tag(name = "Verification")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VerificationApplicationResponse create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateVerificationApplicationRequest request
    ) {
        return verificationService.createApplication(user.userId(), request);
    }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public VerificationDocumentResponse uploadDocument(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @RequestParam String docType,
            @RequestParam("file") MultipartFile file
    ) {
        return verificationService.uploadDocument(id, user.userId(), docType, file);
    }

    @PostMapping("/{id}/submit")
    public VerificationApplicationResponse submit(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id
    ) {
        return verificationService.submit(id, user.userId());
    }

    @GetMapping("/mine")
    public List<VerificationApplicationResponse> listMine(@AuthenticationPrincipal AuthenticatedUser user) {
        return verificationService.listMine(user.userId());
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('" + RoleNames.MODERATOR + "','" + RoleNames.ADMIN + "')")
    public VerificationApplicationResponse approve(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id
    ) {
        return verificationService.approve(id, user.userId());
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('" + RoleNames.MODERATOR + "','" + RoleNames.ADMIN + "')")
    public VerificationApplicationResponse reject(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody RejectVerificationRequest request
    ) {
        return verificationService.reject(id, user.userId(), request.reason());
    }
}
