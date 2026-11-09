package com.guclogistics.companies.infrastructure.persistence;

import com.guclogistics.companies.domain.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyMemberInvitationJpaRepository extends JpaRepository<CompanyMemberInvitationEntity, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select invitation from CompanyMemberInvitationEntity invitation where invitation.id = :id")
    Optional<CompanyMemberInvitationEntity> findByIdForUpdate(UUID id);

    Optional<CompanyMemberInvitationEntity> findByCompanyIdAndEmailIgnoreCaseAndStatus(
            UUID companyId, String email, InvitationStatus status);

    List<CompanyMemberInvitationEntity> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    List<CompanyMemberInvitationEntity> findByEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(
            String email, InvitationStatus status);
}
