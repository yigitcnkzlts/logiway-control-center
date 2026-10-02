package com.guclogistics.offers.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CounterOfferRequest(@NotNull @DecimalMin("0.01") BigDecimal amount,
        @Size(max = 1000) String message, @NotNull Long expectedOfferVersion) {
}
