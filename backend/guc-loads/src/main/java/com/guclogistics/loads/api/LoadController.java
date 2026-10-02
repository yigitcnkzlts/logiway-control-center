package com.guclogistics.loads.api;

import com.guclogistics.loads.application.LoadService;
import com.guclogistics.loads.application.dto.CreateLoadRequest;
import com.guclogistics.loads.application.dto.LoadResponse;
import com.guclogistics.loads.application.dto.UpdateLoadRequest;
import com.guclogistics.loads.domain.LoadStatus;
import com.guclogistics.shared.api.PageResponse;
import com.guclogistics.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/loads")
@Tag(name = "Loads")
@RequiredArgsConstructor
public class LoadController {

    private final LoadService loadService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoadResponse create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateLoadRequest request) {
        return loadService.create(user.userId(), request);
    }

    @GetMapping("/{id}")
    public LoadResponse getById(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        return loadService.getById(id, user.userId());
    }

    @PatchMapping("/{id}")
    public LoadResponse update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLoadRequest request) {
        return loadService.update(id, user.userId(), request);
    }

    @PostMapping("/{id}/publish")
    public LoadResponse publish(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        return loadService.publish(id, user.userId());
    }

    @PostMapping("/{id}/cancel")
    public LoadResponse cancel(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        return loadService.cancel(id, user.userId());
    }

    @GetMapping
    public PageResponse<LoadResponse> search(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) LoadStatus status,
            @RequestParam(required = false) String pickupCountry,
            @RequestParam(required = false) String dropoffCountry,
            @RequestParam(required = false) BigDecimal minWeight,
            @RequestParam(required = false) BigDecimal maxWeight,
            @RequestParam(defaultValue = "false") boolean mine,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return loadService.search(
                user.userId(), mine, status, pickupCountry, dropoffCountry, minWeight, maxWeight, page, size);
    }
}
