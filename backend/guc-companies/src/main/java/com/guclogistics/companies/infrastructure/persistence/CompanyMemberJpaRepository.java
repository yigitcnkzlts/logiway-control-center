package com.guclogistics.companies.infrastructure.persistence;

import com.guclogistics.companies.domain.MemberRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CompanyMemberJpaRepository extends JpaRepository<CompanyMemberEntity, CompanyMemberEntity.CompanyMemberId> {

    Optional<CompanyMemberEntity> findByCompanyIdAndUserId(UUID companyId, UUID userId);

    boolean existsByCompanyIdAndUserId(UUID companyId, UUID userId);

    boolean existsByCompanyIdAndUserIdAndMemberRoleIn(UUID companyId, UUID userId, MemberRole... roles);
}
