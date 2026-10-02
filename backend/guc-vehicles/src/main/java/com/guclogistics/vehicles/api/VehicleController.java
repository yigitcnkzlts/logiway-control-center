package com.guclogistics.vehicles.api;

import com.guclogistics.vehicles.application.VehicleService;
import com.guclogistics.vehicles.application.dto.CreateVehicleRequest;
import com.guclogistics.vehicles.application.dto.UpdateVehicleRequest;
import com.guclogistics.vehicles.application.dto.VehicleResponse;
import com.guclogistics.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vehicles")
@Tag(name = "Vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VehicleResponse create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateVehicleRequest request
    ) {
        return vehicleService.create(user.userId(), request);
    }

    @GetMapping("/mine")
    public List<VehicleResponse> listMine(@AuthenticationPrincipal AuthenticatedUser user) {
        return vehicleService.listMine(user.userId());
    }

    @GetMapping("/{id}")
    public VehicleResponse getById(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id
    ) {
        return vehicleService.getById(id, user.userId());
    }

    @PatchMapping("/{id}")
    public VehicleResponse update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVehicleRequest request
    ) {
        return vehicleService.update(id, user.userId(), request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id
    ) {
        vehicleService.delete(id, user.userId());
    }
}
