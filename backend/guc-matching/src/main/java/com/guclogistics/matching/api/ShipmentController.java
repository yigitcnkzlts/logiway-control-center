package com.guclogistics.matching.api;

import com.guclogistics.matching.application.ShipmentService;
import com.guclogistics.matching.application.dto.ShipmentResponse;
import com.guclogistics.matching.domain.ShipmentStatus;
import com.guclogistics.shared.security.AuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shipments")
@RequiredArgsConstructor
public class ShipmentController {
    private final ShipmentService service;

    @PostMapping("/{id}/status")
    public ShipmentResponse transition(@AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id, @Valid @RequestBody StatusRequest request) {
        return service.transition(id, user.userId(), request.status());
    }

    public record StatusRequest(@NotNull ShipmentStatus status) {}
}
