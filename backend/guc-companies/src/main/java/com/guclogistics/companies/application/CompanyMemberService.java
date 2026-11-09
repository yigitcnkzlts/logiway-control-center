package com.guclogistics.companies.application;

import com.guclogistics.companies.application.dto.*;
import com.guclogistics.companies.domain.InvitationStatus;
import com.guclogistics.companies.domain.MemberRole;
import com.guclogistics.companies.infrastructure.persistence.*;
import com.guclogistics.shared.exception.DomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyMemberService {
    private final CompanyJpaRepository companyRepository;
    private final CompanyMemberJpaRepository memberRepository;
    private final CompanyMemberInvitationJpaRepository invitationRepository;

    @Transactional(readOnly = true)
    public List<CompanyMemberResponse> listMembers(UUID companyId, UUID actorUserId) {
        requireMember(companyId, actorUserId);
        return memberRepository.findMemberRows(companyId).stream()
                .map(row -> new CompanyMemberResponse(
                        (UUID) row[0], row[1].toString(), row[2] != null ? row[2].toString() : null,
                        MemberRole.valueOf(row[3].toString())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CompanyInvitationResponse> listCompanyInvitations(UUID companyId, UUID actorUserId) {
        requireManager(companyId, actorUserId);
        return invitationRepository.findByCompanyIdOrderByCreatedAtDesc(companyId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CompanyInvitationResponse> listMine(String email) {
        return invitationRepository.findByEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(
                        normalizeEmail(email), InvitationStatus.PENDING).stream()
                .filter(invitation -> invitation.getExpiresAt().isAfter(Instant.now()))
                .map(this::toResponse).toList();
    }

    @Transactional
    public CompanyInvitationResponse invite(UUID companyId, UUID actorUserId, InviteCompanyMemberRequest request) {
        companyRepository.findById(companyId).orElseThrow(() -> DomainException.notFound("Company not found"));
        MemberRole actorRole = requireManager(companyId, actorUserId);
        validateAssignableRole(actorRole, request.role());
        String email = normalizeEmail(request.email());
        if (isExistingMember(companyId, email)) throw DomainException.conflict("User is already a company member");
        invitationRepository.findByCompanyIdAndEmailIgnoreCaseAndStatus(
                companyId, email, InvitationStatus.PENDING).ifPresent(existing -> {
                    if (existing.getExpiresAt().isAfter(Instant.now())) {
                        throw DomainException.conflict("A pending invitation already exists for this email");
                    }
                    existing.setStatus(InvitationStatus.EXPIRED);
                    invitationRepository.save(existing);
                });
        CompanyMemberInvitationEntity invitation = new CompanyMemberInvitationEntity();
        invitation.setCompanyId(companyId);
        invitation.setEmail(email);
        invitation.setMemberRole(request.role());
        invitation.setInvitedByUserId(actorUserId);
        invitation.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        return toResponse(invitationRepository.save(invitation));
    }

    @Transactional
    public CompanyMemberResponse accept(UUID invitationId, UUID userId, String userEmail) {
        CompanyMemberInvitationEntity invitation = invitationRepository.findByIdForUpdate(invitationId)
                .orElseThrow(() -> DomainException.notFound("Invitation not found"));
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw DomainException.conflict("Invitation is no longer pending");
        }
        if (!invitation.getEmail().equalsIgnoreCase(normalizeEmail(userEmail))) {
            throw DomainException.forbidden("Invitation belongs to a different email address");
        }
        if (!invitation.getExpiresAt().isAfter(Instant.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw DomainException.business("Invitation has expired");
        }
        if (memberRepository.existsByCompanyIdAndUserId(invitation.getCompanyId(), userId)) {
            throw DomainException.conflict("User is already a company member");
        }
        CompanyMemberEntity member = new CompanyMemberEntity();
        member.setCompanyId(invitation.getCompanyId());
        member.setUserId(userId);
        member.setMemberRole(invitation.getMemberRole());
        memberRepository.save(member);
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setAcceptedByUserId(userId);
        invitation.setAcceptedAt(Instant.now());
        invitationRepository.save(invitation);
        return new CompanyMemberResponse(userId, invitation.getEmail(), null, invitation.getMemberRole());
    }

    @Transactional
    public CompanyMemberResponse updateRole(UUID companyId, UUID targetUserId, UUID actorUserId,
                                            UpdateCompanyMemberRoleRequest request) {
        MemberRole actorRole = requireManager(companyId, actorUserId);
        CompanyMemberEntity target = requireTarget(companyId, targetUserId);
        if (target.getMemberRole() == MemberRole.OWNER) throw DomainException.forbidden("Company owner role cannot be changed");
        validateAssignableRole(actorRole, request.role());
        if (actorRole == MemberRole.ADMIN && target.getMemberRole() == MemberRole.ADMIN) {
            throw DomainException.forbidden("Administrators cannot modify another administrator");
        }
        target.setMemberRole(request.role());
        memberRepository.save(target);
        return memberRepository.findMemberRows(companyId).stream()
                .filter(row -> targetUserId.equals(row[0]))
                .findFirst()
                .map(row -> new CompanyMemberResponse(targetUserId, row[1].toString(),
                        row[2] != null ? row[2].toString() : null, request.role()))
                .orElse(new CompanyMemberResponse(targetUserId, null, null, request.role()));
    }

    @Transactional
    public void remove(UUID companyId, UUID targetUserId, UUID actorUserId) {
        MemberRole actorRole = requireManager(companyId, actorUserId);
        CompanyMemberEntity target = requireTarget(companyId, targetUserId);
        if (target.getMemberRole() == MemberRole.OWNER) throw DomainException.forbidden("Company owner cannot be removed");
        if (actorRole == MemberRole.ADMIN && target.getMemberRole() == MemberRole.ADMIN) {
            throw DomainException.forbidden("Administrators cannot remove another administrator");
        }
        memberRepository.delete(target);
    }

    @Transactional
    public void revokeInvitation(UUID companyId, UUID invitationId, UUID actorUserId) {
        requireManager(companyId, actorUserId);
        CompanyMemberInvitationEntity invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> DomainException.notFound("Invitation not found"));
        if (!invitation.getCompanyId().equals(companyId)) throw DomainException.notFound("Invitation not found");
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw DomainException.conflict("Only pending invitations can be revoked");
        }
        invitation.setStatus(InvitationStatus.REVOKED);
        invitationRepository.save(invitation);
    }

    private boolean isExistingMember(UUID companyId, String email) {
        return memberRepository.findMemberRows(companyId).stream()
                .anyMatch(row -> email.equalsIgnoreCase(row[1].toString()));
    }

    private void requireMember(UUID companyId, UUID userId) {
        if (!memberRepository.existsByCompanyIdAndUserId(companyId, userId)) {
            throw DomainException.forbidden("Not a member of this company");
        }
    }

    private MemberRole requireManager(UUID companyId, UUID userId) {
        CompanyMemberEntity member = memberRepository.findByCompanyIdAndUserId(companyId, userId)
                .orElseThrow(() -> DomainException.forbidden("Not a member of this company"));
        if (member.getMemberRole() != MemberRole.OWNER && member.getMemberRole() != MemberRole.ADMIN) {
            throw DomainException.forbidden("Only company owner or admin can manage members");
        }
        return member.getMemberRole();
    }

    private CompanyMemberEntity requireTarget(UUID companyId, UUID userId) {
        return memberRepository.findByCompanyIdAndUserId(companyId, userId)
                .orElseThrow(() -> DomainException.notFound("Company member not found"));
    }

    private void validateAssignableRole(MemberRole actorRole, MemberRole requestedRole) {
        if (requestedRole == MemberRole.OWNER) throw DomainException.forbidden("Owner role cannot be assigned by invitation");
        if (actorRole == MemberRole.ADMIN && requestedRole == MemberRole.ADMIN) {
            throw DomainException.forbidden("Only the company owner can assign administrator role");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private CompanyInvitationResponse toResponse(CompanyMemberInvitationEntity entity) {
        return new CompanyInvitationResponse(entity.getId(), entity.getCompanyId(), entity.getEmail(),
                entity.getMemberRole(), entity.getStatus(), entity.getExpiresAt(), entity.getCreatedAt());
    }
}
