package com.guclogistics.companies.infrastructure.persistence;

import com.guclogistics.companies.domain.MemberRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyMemberJpaRepository extends JpaRepository<CompanyMemberEntity, CompanyMemberEntity.CompanyMemberId> {

    Optional<CompanyMemberEntity> findByCompanyIdAndUserId(UUID companyId, UUID userId);

    boolean existsByCompanyIdAndUserId(UUID companyId, UUID userId);

    boolean existsByCompanyIdAndUserIdAndMemberRoleIn(UUID companyId, UUID userId, MemberRole... roles);

    @Query(value = """
            SELECT cm.user_id, u.email, u.phone, cm.member_role
            FROM company_members cm
            JOIN users u ON u.id = cm.user_id
            WHERE cm.company_id = :companyId
            ORDER BY CASE cm.member_role WHEN 'OWNER' THEN 0 WHEN 'ADMIN' THEN 1 ELSE 2 END, u.email
            """, nativeQuery = true)
    List<Object[]> findMemberRows(@Param("companyId") UUID companyId);
}
