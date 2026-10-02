package com.guclogistics.companies.application;

import com.guclogistics.companies.application.dto.CreateCompanyRequest;
import com.guclogistics.companies.application.dto.UpdateCompanyRequest;
import com.guclogistics.companies.domain.CompanyStatus;
import com.guclogistics.companies.domain.CompanyType;
import com.guclogistics.companies.domain.event.CompanyCreatedEvent;
import com.guclogistics.companies.infrastructure.persistence.CompanyEntity;
import com.guclogistics.companies.infrastructure.persistence.CompanyJpaRepository;
import com.guclogistics.companies.infrastructure.persistence.CompanyMemberEntity;
import com.guclogistics.companies.infrastructure.persistence.CompanyMemberJpaRepository;
import com.guclogistics.shared.event.DomainEventPublisher;
import com.guclogistics.shared.exception.DomainException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock private CompanyJpaRepository companyRepository;
    @Mock private CompanyMemberJpaRepository memberRepository;
    @Mock private DomainEventPublisher eventPublisher;

    @InjectMocks
    private CompanyService companyService;

    @Test
    void createPersistsCompanyMemberAndPublishesEvent() {
        UUID userId = UUID.randomUUID();
        CreateCompanyRequest request = new CreateCompanyRequest(
                CompanyType.SHIPPER, "Acme Logistics", "Acme", "TR123", "tr");

        when(companyRepository.save(any(CompanyEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        when(memberRepository.save(any(CompanyMemberEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = companyService.create(userId, request);

        assertThat(response.legalName()).isEqualTo("Acme Logistics");
        assertThat(response.country()).isEqualTo("TR");
        assertThat(response.status()).isEqualTo(CompanyStatus.PENDING);

        verify(memberRepository).save(any(CompanyMemberEntity.class));
        ArgumentCaptor<CompanyCreatedEvent> captor = ArgumentCaptor.forClass(CompanyCreatedEvent.class);
        verify(eventPublisher).publish(captor.capture());
        assertThat(captor.getValue().legalName()).isEqualTo("Acme Logistics");
    }

    @Test
    void listMineReturnsUserCompanies() {
        UUID userId = UUID.randomUUID();
        CompanyEntity company = company(userId, "Mine Co");
        when(companyRepository.findByMemberUserId(userId)).thenReturn(List.of(company));

        assertThat(companyService.listMine(userId)).hasSize(1)
                .first()
                .extracting("legalName")
                .isEqualTo("Mine Co");
    }

    @Test
    void getByIdForNonMemberThrowsForbidden() {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        when(memberRepository.existsByCompanyIdAndUserId(companyId, userId)).thenReturn(false);

        assertThatThrownBy(() -> companyService.getById(companyId, userId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Not a member");
    }

    @Test
    void getByIdForMemberReturnsCompany() {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        CompanyEntity company = company(userId, "Acme");
        company.setId(companyId);

        when(memberRepository.existsByCompanyIdAndUserId(companyId, userId)).thenReturn(true);
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));

        assertThat(companyService.getById(companyId, userId).legalName()).isEqualTo("Acme");
    }

    @Test
    void getByIdNotFoundAfterMembershipCheck() {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        when(memberRepository.existsByCompanyIdAndUserId(companyId, userId)).thenReturn(true);
        when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyService.getById(companyId, userId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Company not found");
    }

    @Test
    void updateByNonAdminForbidden() {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        when(memberRepository.existsByCompanyIdAndUserIdAndMemberRoleIn(
                eq(companyId), eq(userId), any(), any())).thenReturn(false);

        assertThatThrownBy(() -> companyService.update(companyId, userId, new UpdateCompanyRequest("New", null, null, null)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("owner or admin");
    }

    @Test
    void updateByOwnerAppliesChanges() {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        CompanyEntity company = company(userId, "Old Name");
        company.setId(companyId);

        when(memberRepository.existsByCompanyIdAndUserIdAndMemberRoleIn(
                eq(companyId), eq(userId), any(), any())).thenReturn(true);
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(companyRepository.save(company)).thenReturn(company);

        var response = companyService.update(companyId, userId,
                new UpdateCompanyRequest("New Name", "Trade", "VAT1", "de"));

        assertThat(response.legalName()).isEqualTo("New Name");
        assertThat(response.country()).isEqualTo("DE");
    }

    @Test
    void updateStatusFromVerificationSuccess() {
        UUID companyId = UUID.randomUUID();
        when(companyRepository.updateStatus(companyId, CompanyStatus.VERIFIED.name())).thenReturn(1);

        companyService.updateStatusFromVerification(companyId, CompanyStatus.VERIFIED);

        verify(companyRepository).updateStatus(companyId, CompanyStatus.VERIFIED.name());
    }

    @Test
    void updateStatusFromVerificationNotFound() {
        UUID companyId = UUID.randomUUID();
        when(companyRepository.updateStatus(companyId, CompanyStatus.REJECTED.name())).thenReturn(0);

        assertThatThrownBy(() -> companyService.updateStatusFromVerification(companyId, CompanyStatus.REJECTED))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Company not found for verification");
    }

    private static CompanyEntity company(UUID userId, String legalName) {
        CompanyEntity company = new CompanyEntity();
        company.setType(CompanyType.SHIPPER);
        company.setLegalName(legalName);
        company.setCountry("TR");
        company.setStatus(CompanyStatus.PENDING);
        company.setCreatedByUserId(userId);
        return company;
    }
}
