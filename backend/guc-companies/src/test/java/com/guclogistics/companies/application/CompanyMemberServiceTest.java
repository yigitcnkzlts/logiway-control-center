package com.guclogistics.companies.application;

import com.guclogistics.companies.application.dto.InviteCompanyMemberRequest;
import com.guclogistics.companies.application.dto.UpdateCompanyMemberRoleRequest;
import com.guclogistics.companies.domain.InvitationStatus;
import com.guclogistics.companies.domain.MemberRole;
import com.guclogistics.companies.infrastructure.persistence.*;
import com.guclogistics.shared.exception.DomainException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyMemberServiceTest {
    @Mock CompanyJpaRepository companyRepository;
    @Mock CompanyMemberJpaRepository memberRepository;
    @Mock CompanyMemberInvitationJpaRepository invitationRepository;

    private CompanyMemberService service() {
        return new CompanyMemberService(companyRepository, memberRepository, invitationRepository);
    }

    @Test
    void ownerCreatesNormalizedExpiringInvitation() {
        UUID companyId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(new CompanyEntity()));
        when(memberRepository.findByCompanyIdAndUserId(companyId, ownerId))
                .thenReturn(Optional.of(member(companyId, ownerId, MemberRole.OWNER)));
        when(memberRepository.findMemberRows(companyId)).thenReturn(List.of());
        when(invitationRepository.findByCompanyIdAndEmailIgnoreCaseAndStatus(
                companyId, "operator@example.com", InvitationStatus.PENDING)).thenReturn(Optional.empty());
        when(invitationRepository.save(any())).thenAnswer(invocation -> {
            CompanyMemberInvitationEntity entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            entity.setStatus(InvitationStatus.PENDING);
            entity.setCreatedAt(Instant.now());
            return entity;
        });

        var response = service().invite(companyId, ownerId,
                new InviteCompanyMemberRequest(" Operator@Example.COM ", MemberRole.OPERATIONS));

        assertThat(response.email()).isEqualTo("operator@example.com");
        assertThat(response.role()).isEqualTo(MemberRole.OPERATIONS);
        assertThat(response.expiresAt()).isAfter(Instant.now().plus(6, java.time.temporal.ChronoUnit.DAYS));
    }

    @Test
    void administratorCannotInviteAnotherAdministrator() {
        UUID companyId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(new CompanyEntity()));
        when(memberRepository.findByCompanyIdAndUserId(companyId, adminId))
                .thenReturn(Optional.of(member(companyId, adminId, MemberRole.ADMIN)));

        assertThatThrownBy(() -> service().invite(companyId, adminId,
                new InviteCompanyMemberRequest("new@example.com", MemberRole.ADMIN)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Only the company owner");
        verify(invitationRepository, never()).save(any());
    }

    @Test
    void expiredPendingInvitationIsClosedBeforeReplacement() {
        UUID companyId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        CompanyMemberInvitationEntity expired = invitation(companyId, "ops@example.com", MemberRole.OPERATIONS);
        expired.setExpiresAt(Instant.now().minusSeconds(1));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(new CompanyEntity()));
        when(memberRepository.findByCompanyIdAndUserId(companyId, ownerId))
                .thenReturn(Optional.of(member(companyId, ownerId, MemberRole.OWNER)));
        when(memberRepository.findMemberRows(companyId)).thenReturn(List.of());
        when(invitationRepository.findByCompanyIdAndEmailIgnoreCaseAndStatus(
                companyId, "ops@example.com", InvitationStatus.PENDING)).thenReturn(Optional.of(expired));
        when(invitationRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service().invite(companyId, ownerId,
                new InviteCompanyMemberRequest("ops@example.com", MemberRole.OPERATIONS));

        assertThat(expired.getStatus()).isEqualTo(InvitationStatus.EXPIRED);
        verify(invitationRepository, times(2)).save(any());
    }

    @Test
    void invitationCannotBeAcceptedByDifferentEmail() {
        UUID invitationId = UUID.randomUUID();
        CompanyMemberInvitationEntity invitation = invitation(UUID.randomUUID(), "target@example.com", MemberRole.FINANCE);
        when(invitationRepository.findByIdForUpdate(invitationId)).thenReturn(Optional.of(invitation));

        assertThatThrownBy(() -> service().accept(invitationId, UUID.randomUUID(), "attacker@example.com"))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("different email");
        verify(memberRepository, never()).save(any());
    }

    @Test
    void matchingUserAcceptsInvitationAtomically() {
        UUID invitationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        CompanyMemberInvitationEntity invitation = invitation(companyId, "target@example.com", MemberRole.FINANCE);
        when(invitationRepository.findByIdForUpdate(invitationId)).thenReturn(Optional.of(invitation));
        when(memberRepository.existsByCompanyIdAndUserId(companyId, userId)).thenReturn(false);
        when(memberRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(invitationRepository.save(invitation)).thenReturn(invitation);

        var response = service().accept(invitationId, userId, "TARGET@example.com");

        assertThat(response.role()).isEqualTo(MemberRole.FINANCE);
        assertThat(invitation.getStatus()).isEqualTo(InvitationStatus.ACCEPTED);
        assertThat(invitation.getAcceptedByUserId()).isEqualTo(userId);
        ArgumentCaptor<CompanyMemberEntity> member = ArgumentCaptor.forClass(CompanyMemberEntity.class);
        verify(memberRepository).save(member.capture());
        assertThat(member.getValue().getCompanyId()).isEqualTo(companyId);
    }

    @Test
    void ownerMembershipCannotBeChangedOrRemoved() {
        UUID companyId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        when(memberRepository.findByCompanyIdAndUserId(companyId, actorId))
                .thenReturn(Optional.of(member(companyId, actorId, MemberRole.OWNER)));
        when(memberRepository.findByCompanyIdAndUserId(companyId, ownerId))
                .thenReturn(Optional.of(member(companyId, ownerId, MemberRole.OWNER)));

        assertThatThrownBy(() -> service().updateRole(companyId, ownerId, actorId,
                new UpdateCompanyMemberRoleRequest(MemberRole.ADMIN)))
                .isInstanceOf(DomainException.class).hasMessageContaining("owner role");
        assertThatThrownBy(() -> service().remove(companyId, ownerId, actorId))
                .isInstanceOf(DomainException.class).hasMessageContaining("owner cannot be removed");
    }

    @Test
    void nonMemberCannotListCompanyMembers() {
        UUID companyId = UUID.randomUUID();
        UUID outsider = UUID.randomUUID();
        when(memberRepository.existsByCompanyIdAndUserId(companyId, outsider)).thenReturn(false);

        assertThatThrownBy(() -> service().listMembers(companyId, outsider))
                .isInstanceOf(DomainException.class).hasMessageContaining("Not a member");
    }

    private static CompanyMemberEntity member(UUID companyId, UUID userId, MemberRole role) {
        CompanyMemberEntity entity = new CompanyMemberEntity();
        entity.setCompanyId(companyId);
        entity.setUserId(userId);
        entity.setMemberRole(role);
        return entity;
    }

    private static CompanyMemberInvitationEntity invitation(UUID companyId, String email, MemberRole role) {
        CompanyMemberInvitationEntity entity = new CompanyMemberInvitationEntity();
        entity.setId(UUID.randomUUID());
        entity.setCompanyId(companyId);
        entity.setEmail(email);
        entity.setMemberRole(role);
        entity.setStatus(InvitationStatus.PENDING);
        entity.setExpiresAt(Instant.now().plusSeconds(3600));
        return entity;
    }
}
