package com.guclogistics.companies.application;

import com.guclogistics.companies.infrastructure.persistence.CompanyJpaRepository;
import com.guclogistics.companies.infrastructure.persistence.CompanyMemberJpaRepository;
import com.guclogistics.shared.exception.DomainException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyDashboardServiceTest {
    @Mock CompanyJpaRepository companyRepository;
    @Mock CompanyMemberJpaRepository memberRepository;
    @Mock JdbcTemplate jdbc;
    @InjectMocks CompanyDashboardService service;

    @Test
    void companyBUserCannotReadCompanyADashboard() {
        UUID companyA = UUID.randomUUID();
        UUID companyBUser = UUID.randomUUID();
        when(memberRepository.existsByCompanyIdAndUserId(companyA, companyBUser)).thenReturn(false);

        assertThatThrownBy(() -> service.get(companyA, companyBUser, 12))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("access denied");
    }
}
