package com.guclogistics.companies.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CompanyDashboardResponse(
        CompanySummary company,
        CompanyKpis kpis,
        List<MonthlyMetric> monthly,
        List<DriverMetric> drivers,
        List<LoadMetric> recentLoads,
        List<TripMetric> recentTrips
) {
    public record CompanySummary(UUID id, String name, String type, String country, String status) {}
    public record CompanyKpis(long drivers, long vehicles, long loads, long offers, long activeTrips,
                              long completedTrips, BigDecimal grossRevenue) {}
    public record MonthlyMetric(String month, long loads, long offers, long trips, BigDecimal revenue) {}
    public record DriverMetric(UUID id, String name, String email, String status, int yearsExperience,
                               long completedTrips, BigDecimal revenue) {}
    public record LoadMetric(UUID id, String title, String route, String status, long offerCount,
                             BigDecimal acceptedAmount, String currency, Instant createdAt) {}
    public record TripMetric(UUID id, String loadTitle, String route, String driverName, BigDecimal amount,
                             String currency, String status, Instant matchedAt) {}
}
