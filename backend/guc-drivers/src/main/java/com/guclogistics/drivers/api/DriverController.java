package com.guclogistics.drivers.api;

import com.guclogistics.drivers.application.DriverProfileService;
import com.guclogistics.drivers.application.dto.CreateDriverProfileRequest;
import com.guclogistics.drivers.application.dto.DriverProfileResponse;
import com.guclogistics.drivers.application.dto.UpdateDriverProfileRequest;
import com.guclogistics.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/drivers")
@Tag(name = "Drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverProfileService driverProfileService;

    @PostMapping("/profile")
    public DriverProfileResponse createProfile(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateDriverProfileRequest request
    ) {
        return driverProfileService.create(user.userId(), request);
    }

    @GetMapping("/me")
    public DriverProfileResponse getMine(@AuthenticationPrincipal AuthenticatedUser user) {
        return driverProfileService.getMine(user.userId());
    }

    @PatchMapping("/me")
    public DriverProfileResponse updateMine(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody UpdateDriverProfileRequest request
    ) {
        return driverProfileService.updateMine(user.userId(), request);
    }
}
