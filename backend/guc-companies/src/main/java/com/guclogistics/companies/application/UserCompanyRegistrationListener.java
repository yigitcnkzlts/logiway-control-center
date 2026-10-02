package com.guclogistics.companies.application;

import com.guclogistics.companies.application.dto.CreateCompanyRequest;
import com.guclogistics.companies.domain.CompanyType;
import com.guclogistics.shared.events.identity.UserCompanyRegistrationRequestedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class UserCompanyRegistrationListener {
    private final CompanyService companyService;

    @EventListener
    @Transactional
    public void onCompanyRegistrationRequested(UserCompanyRegistrationRequestedEvent event) {
        CompanyType type = "SHIPPER".equals(event.role()) ? CompanyType.SHIPPER : CompanyType.LOGISTICS;
        companyService.create(event.userId(), new CreateCompanyRequest(
                type, event.companyName(), event.companyName(), null, event.companyCountry()));
    }
}
