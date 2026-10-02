package com.guclogistics.companies.application;

import com.guclogistics.companies.application.dto.CompanyResponse;
import com.guclogistics.companies.application.dto.CreateCompanyRequest;
import com.guclogistics.companies.application.dto.UpdateCompanyRequest;
import com.guclogistics.companies.domain.CompanyStatus;
import com.guclogistics.companies.domain.MemberRole;
import com.guclogistics.companies.domain.event.CompanyCreatedEvent;
import com.guclogistics.companies.infrastructure.persistence.CompanyEntity;
import com.guclogistics.companies.infrastructure.persistence.CompanyJpaRepository;
import com.guclogistics.companies.infrastructure.persistence.CompanyMemberEntity;
import com.guclogistics.companies.infrastructure.persistence.CompanyMemberJpaRepository;
import com.guclogistics.shared.event.DomainEventPublisher;
import com.guclogistics.shared.exception.DomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyJpaRepository companyRepository;
    private final CompanyMemberJpaRepository memberRepository;
    private final DomainEventPublisher eventPublisher;

    @Transactional
    public CompanyResponse create(UUID userId, CreateCompanyRequest request) {
        CompanyEntity company = new CompanyEntity();
        company.setType(request.type());
        company.setLegalName(request.legalName());
        company.setTradeName(request.tradeName());
        company.setVatNumber(request.vatNumber());
        company.setCountry(request.country().toUpperCase());
        company.setStatus(CompanyStatus.PENDING);
        company.setCreatedByUserId(userId);
        companyRepository.save(company);

        CompanyMemberEntity member = new CompanyMemberEntity();
        member.setCompanyId(company.getId());
        member.setUserId(userId);
        member.setMemberRole(MemberRole.OWNER);
        memberRepository.save(member);

        eventPublisher.publish(new CompanyCreatedEvent(
                company.getId(),
                userId,
                company.getType().name(),
                company.getLegalName()
        ));

        return toResponse(company);
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> listMine(UUID userId) {
        return companyRepository.findByMemberUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CompanyResponse getById(UUID companyId, UUID userId) {
        requireMember(companyId, userId);
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> DomainException.notFound("Company not found"));
        return toResponse(company);
    }

    @Transactional
    public CompanyResponse update(UUID companyId, UUID userId, UpdateCompanyRequest request) {
        requireAdminOrOwner(companyId, userId);
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> DomainException.notFound("Company not found"));

        if (request.legalName() != null) {
            company.setLegalName(request.legalName());
        }
        if (request.tradeName() != null) {
            company.setTradeName(request.tradeName());
        }
        if (request.vatNumber() != null) {
            company.setVatNumber(request.vatNumber());
        }
        if (request.country() != null) {
            company.setCountry(request.country().toUpperCase());
        }

        return toResponse(companyRepository.save(company));
    }

    @Transactional
    public void updateStatusFromVerification(UUID companyId, CompanyStatus status) {
        int updated = companyRepository.updateStatus(companyId, status.name());
        if (updated == 0) {
            throw DomainException.notFound("Company not found for verification update");
        }
    }

    private void requireMember(UUID companyId, UUID userId) {
        if (!memberRepository.existsByCompanyIdAndUserId(companyId, userId)) {
            throw DomainException.forbidden("Not a member of this company");
        }
    }

    private void requireAdminOrOwner(UUID companyId, UUID userId) {
        if (!memberRepository.existsByCompanyIdAndUserIdAndMemberRoleIn(
                companyId, userId, MemberRole.OWNER, MemberRole.ADMIN)) {
            throw DomainException.forbidden("Only company owner or admin can perform this action");
        }
    }

    private CompanyResponse toResponse(CompanyEntity company) {
        return new CompanyResponse(
                company.getId(),
                company.getType(),
                company.getLegalName(),
                company.getTradeName(),
                company.getVatNumber(),
                company.getCountry(),
                company.getStatus(),
                company.getCreatedByUserId(),
                company.getCreatedAt(),
                company.getUpdatedAt()
        );
    }
}
