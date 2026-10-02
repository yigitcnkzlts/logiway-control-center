package com.guclogistics.offers.api;

import com.guclogistics.offers.application.OfferService;
import com.guclogistics.offers.application.dto.CreateOfferRequest;
import com.guclogistics.offers.application.dto.OfferResponse;
import com.guclogistics.offers.application.dto.CounterOfferRequest;
import com.guclogistics.offers.application.dto.OfferRoundResponse;
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
@Tag(name = "Offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;

    @PostMapping("/api/v1/loads/{loadId}/offers")
    @ResponseStatus(HttpStatus.CREATED)
    public OfferResponse submitOffer(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID loadId,
            @Valid @RequestBody CreateOfferRequest request
    ) {
        return offerService.submitOffer(loadId, user.userId(), request);
    }

    @PostMapping("/api/v1/offers/{id}/accept")
    public OfferResponse accept(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id
    ) {
        return offerService.accept(id, user.userId());
    }

    @PostMapping("/api/v1/offers/{id}/counter")
    public OfferResponse counter(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id,
            @Valid @RequestBody CounterOfferRequest request) {
        return offerService.counter(id, user.userId(), request);
    }

    @GetMapping("/api/v1/offers/{id}/rounds")
    public List<OfferRoundResponse> rounds(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        return offerService.rounds(id, user.userId());
    }

    @PostMapping("/api/v1/offers/{id}/reject")
    public OfferResponse reject(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id
    ) {
        return offerService.reject(id, user.userId());
    }

    @PostMapping("/api/v1/offers/{id}/withdraw")
    public OfferResponse withdraw(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id
    ) {
        return offerService.withdraw(id, user.userId());
    }

    @GetMapping("/api/v1/offers/mine")
    public List<OfferResponse> listMine(@AuthenticationPrincipal AuthenticatedUser user) {
        return offerService.listMine(user.userId());
    }

    @GetMapping("/api/v1/loads/{loadId}/offers")
    public List<OfferResponse> listForLoad(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID loadId) {
        return offerService.listForLoad(loadId, user.userId());
    }
}
