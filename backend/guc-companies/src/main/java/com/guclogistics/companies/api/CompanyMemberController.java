package com.guclogistics.companies.api;

import com.guclogistics.companies.application.CompanyMemberService;
import com.guclogistics.companies.application.dto.*;
import com.guclogistics.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/companies")
@Tag(name = "Company Members")
@RequiredArgsConstructor
public class CompanyMemberController {
    private final CompanyMemberService service;

    @GetMapping("/{companyId}/members")
    public List<CompanyMemberResponse> members(@AuthenticationPrincipal AuthenticatedUser user,
                                               @PathVariable UUID companyId) {
        return service.listMembers(companyId, user.userId());
    }

    @GetMapping("/{companyId}/invitations")
    public List<CompanyInvitationResponse> invitations(@AuthenticationPrincipal AuthenticatedUser user,
                                                       @PathVariable UUID companyId) {
        return service.listCompanyInvitations(companyId, user.userId());
    }

    @GetMapping("/invitations/mine")
    public List<CompanyInvitationResponse> myInvitations(@AuthenticationPrincipal AuthenticatedUser user) {
        return service.listMine(user.email());
    }

    @PostMapping("/{companyId}/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public CompanyInvitationResponse invite(@AuthenticationPrincipal AuthenticatedUser user,
                                            @PathVariable UUID companyId,
                                            @Valid @RequestBody InviteCompanyMemberRequest request) {
        return service.invite(companyId, user.userId(), request);
    }

    @PostMapping("/invitations/{invitationId}/accept")
    public CompanyMemberResponse accept(@AuthenticationPrincipal AuthenticatedUser user,
                                        @PathVariable UUID invitationId) {
        return service.accept(invitationId, user.userId(), user.email());
    }

    @PatchMapping("/{companyId}/members/{userId}/role")
    public CompanyMemberResponse updateRole(@AuthenticationPrincipal AuthenticatedUser user,
                                            @PathVariable UUID companyId,
                                            @PathVariable UUID userId,
                                            @Valid @RequestBody UpdateCompanyMemberRoleRequest request) {
        return service.updateRole(companyId, userId, user.userId(), request);
    }

    @DeleteMapping("/{companyId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal AuthenticatedUser user,
                       @PathVariable UUID companyId, @PathVariable UUID userId) {
        service.remove(companyId, userId, user.userId());
    }

    @DeleteMapping("/{companyId}/invitations/{invitationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@AuthenticationPrincipal AuthenticatedUser user,
                       @PathVariable UUID companyId, @PathVariable UUID invitationId) {
        service.revokeInvitation(companyId, invitationId, user.userId());
    }
}
