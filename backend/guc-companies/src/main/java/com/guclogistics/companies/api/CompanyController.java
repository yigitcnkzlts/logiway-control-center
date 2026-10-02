package com.guclogistics.companies.api;

import com.guclogistics.companies.application.CompanyService;
import com.guclogistics.companies.application.CompanyDashboardService;
import com.guclogistics.companies.application.dto.CompanyDashboardResponse;
import com.guclogistics.companies.application.dto.CompanyResponse;
import com.guclogistics.companies.application.dto.CreateCompanyRequest;
import com.guclogistics.companies.application.dto.UpdateCompanyRequest;
import com.guclogistics.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/companies")
@Tag(name = "Companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final CompanyDashboardService companyDashboardService;

    @PostMapping
    public CompanyResponse create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateCompanyRequest request
    ) {
        return companyService.create(user.userId(), request);
    }

    @GetMapping("/mine")
    public List<CompanyResponse> listMine(@AuthenticationPrincipal AuthenticatedUser user) {
        return companyService.listMine(user.userId());
    }

    @GetMapping("/{id}")
    public CompanyResponse getById(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id
    ) {
        return companyService.getById(id, user.userId());
    }

    @GetMapping("/{id}/dashboard")
    public CompanyDashboardResponse dashboard(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "12") int months
    ) {
        return companyDashboardService.get(id, user.userId(), months);
    }

    @PatchMapping("/{id}")
    public CompanyResponse update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCompanyRequest request
    ) {
        return companyService.update(id, user.userId(), request);
    }
}
