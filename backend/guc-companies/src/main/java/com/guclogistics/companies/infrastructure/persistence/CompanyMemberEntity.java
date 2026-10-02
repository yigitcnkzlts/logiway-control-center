package com.guclogistics.companies.infrastructure.persistence;

import com.guclogistics.companies.domain.MemberRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "company_members")
@IdClass(CompanyMemberEntity.CompanyMemberId.class)
@Getter
@Setter
public class CompanyMemberEntity {

    @Id
    @Column(name = "company_id")
    private UUID companyId;

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_role", nullable = false, length = 20)
    private MemberRole memberRole;

    @Getter
    @Setter
    public static class CompanyMemberId implements Serializable {
        private UUID companyId;
        private UUID userId;
    }
}
