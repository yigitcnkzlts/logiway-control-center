package com.guclogistics.companies.application;

import com.guclogistics.companies.application.dto.CompanyDashboardResponse;
import com.guclogistics.companies.infrastructure.persistence.CompanyEntity;
import com.guclogistics.companies.infrastructure.persistence.CompanyJpaRepository;
import com.guclogistics.companies.infrastructure.persistence.CompanyMemberJpaRepository;
import com.guclogistics.shared.exception.DomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyDashboardService {

    private final CompanyJpaRepository companyRepository;
    private final CompanyMemberJpaRepository memberRepository;
    private final JdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public CompanyDashboardResponse get(UUID companyId, UUID userId, int requestedMonths) {
        if (!memberRepository.existsByCompanyIdAndUserId(companyId, userId)) {
            throw DomainException.forbidden("Company dashboard access denied");
        }
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> DomainException.notFound("Company not found"));
        int months = Math.max(1, Math.min(requestedMonths, 24));
        boolean shipper = "SHIPPER".equals(company.getType().name());

        var summary = new CompanyDashboardResponse.CompanySummary(company.getId(),
                company.getTradeName() == null ? company.getLegalName() : company.getTradeName(),
                company.getType().name(), company.getCountry(), company.getStatus().name());
        var kpis = loadKpis(companyId, shipper);
        return new CompanyDashboardResponse(summary, kpis, loadMonthly(companyId, shipper, months),
                loadDrivers(companyId), loadRecentLoads(companyId, shipper), loadRecentTrips(companyId, shipper));
    }

    private CompanyDashboardResponse.CompanyKpis loadKpis(UUID companyId, boolean shipper) {
        long drivers = count("SELECT COUNT(*) FROM driver_profiles WHERE company_id = ?", companyId);
        long vehicles = count("SELECT COUNT(*) FROM vehicles WHERE owner_id = ?", companyId);
        long loads = shipper
                ? count("SELECT COUNT(*) FROM loads WHERE shipper_company_id = ?", companyId)
                : count("SELECT COUNT(DISTINCT load_id) FROM offers WHERE offerer_id = ?", companyId);
        long offers = shipper
                ? count("SELECT COUNT(*) FROM offers o JOIN loads l ON l.id=o.load_id WHERE l.shipper_company_id = ?", companyId)
                : count("SELECT COUNT(*) FROM offers WHERE offerer_id = ?", companyId);
        String side = shipper ? "l.shipper_company_id" : "o.offerer_id";
        long active = count("SELECT COUNT(*) FROM matches m JOIN loads l ON l.id=m.load_id JOIN offers o ON o.id=m.offer_id WHERE " + side + " = ? AND m.status='ACTIVE'", companyId);
        long completed = count("SELECT COUNT(*) FROM matches m JOIN loads l ON l.id=m.load_id JOIN offers o ON o.id=m.offer_id WHERE " + side + " = ? AND m.status='COMPLETED'", companyId);
        BigDecimal revenue = shipper ? BigDecimal.ZERO : money("SELECT COALESCE(SUM(o.amount),0) FROM matches m JOIN offers o ON o.id=m.offer_id WHERE o.offerer_id=? AND m.status IN ('ACTIVE','COMPLETED')", companyId);
        return new CompanyDashboardResponse.CompanyKpis(drivers, vehicles, loads, offers, active, completed, revenue);
    }

    private List<CompanyDashboardResponse.MonthlyMetric> loadMonthly(UUID companyId, boolean shipper, int months) {
        String loadCondition = shipper ? "l.shipper_company_id = ?" : "EXISTS (SELECT 1 FROM offers ox WHERE ox.load_id=l.id AND ox.offerer_id=?)";
        String offerCondition = shipper ? "EXISTS (SELECT 1 FROM loads lx WHERE lx.id=o.load_id AND lx.shipper_company_id=?)" : "o.offerer_id=?";
        String matchCondition = shipper ? "l.shipper_company_id=?" : "o.offerer_id=?";
        String sql = """
                SELECT to_char(month_start,'YYYY-MM') month,
                  (SELECT COUNT(*) FROM loads l WHERE %s AND date_trunc('month',l.created_at)=month_start) loads,
                  (SELECT COUNT(*) FROM offers o WHERE %s AND date_trunc('month',o.created_at)=month_start) offers,
                  (SELECT COUNT(*) FROM matches mt JOIN loads l ON l.id=mt.load_id JOIN offers o ON o.id=mt.offer_id
                    WHERE %s AND date_trunc('month',mt.matched_at)=month_start) trips,
                  (SELECT COALESCE(SUM(o.amount),0) FROM matches mt JOIN loads l ON l.id=mt.load_id JOIN offers o ON o.id=mt.offer_id
                    WHERE %s AND mt.status IN ('ACTIVE','COMPLETED') AND date_trunc('month',mt.matched_at)=month_start) revenue
                FROM generate_series(date_trunc('month',CURRENT_DATE) - (? * interval '1 month'),
                     date_trunc('month',CURRENT_DATE), interval '1 month') month_start
                ORDER BY month_start
                """.formatted(loadCondition, offerCondition, matchCondition, matchCondition);
        return jdbc.query(sql, (rs, row) -> new CompanyDashboardResponse.MonthlyMetric(rs.getString("month"),
                rs.getLong("loads"), rs.getLong("offers"), rs.getLong("trips"), rs.getBigDecimal("revenue")),
                companyId, companyId, companyId, companyId, months - 1);
    }

    private List<CompanyDashboardResponse.DriverMetric> loadDrivers(UUID companyId) {
        return jdbc.query("""
                SELECT d.id, u.email,
                  COALESCE((SELECT o.driver_name FROM offers o WHERE o.created_by_user_id=d.user_id ORDER BY o.created_at DESC LIMIT 1), split_part(u.email,'@',1)) driver_name,
                  d.status, d.years_experience,
                  (SELECT COUNT(*) FROM matches m JOIN offers o ON o.id=m.offer_id WHERE o.created_by_user_id=d.user_id AND m.status='COMPLETED') completed_trips,
                  (SELECT COALESCE(SUM(o.amount),0) FROM matches m JOIN offers o ON o.id=m.offer_id WHERE o.created_by_user_id=d.user_id AND m.status IN ('ACTIVE','COMPLETED')) revenue
                FROM driver_profiles d JOIN users u ON u.id=d.user_id WHERE d.company_id=? ORDER BY driver_name
                """, (rs, row) -> new CompanyDashboardResponse.DriverMetric((UUID) rs.getObject("id"), rs.getString("driver_name"),
                rs.getString("email"), rs.getString("status"), rs.getInt("years_experience"),
                rs.getLong("completed_trips"), rs.getBigDecimal("revenue")), companyId);
    }

    private List<CompanyDashboardResponse.LoadMetric> loadRecentLoads(UUID companyId, boolean shipper) {
        String where = shipper ? "l.shipper_company_id=?" : "EXISTS (SELECT 1 FROM offers ox WHERE ox.load_id=l.id AND ox.offerer_id=?)";
        return jdbc.query("SELECT l.id,l.title,concat(l.pickup_city,', ',l.pickup_country,' → ',l.dropoff_city,', ',l.dropoff_country) route,l.status,l.currency,l.created_at," +
                "(SELECT COUNT(*) FROM offers o WHERE o.load_id=l.id) offer_count,(SELECT MAX(o.amount) FROM offers o WHERE o.load_id=l.id AND o.status='ACCEPTED') accepted_amount " +
                "FROM loads l WHERE " + where + " ORDER BY l.created_at DESC LIMIT 20",
                (rs, row) -> new CompanyDashboardResponse.LoadMetric((UUID) rs.getObject("id"), rs.getString("title"), rs.getString("route"),
                        rs.getString("status"), rs.getLong("offer_count"), rs.getBigDecimal("accepted_amount"), rs.getString("currency"),
                        rs.getTimestamp("created_at").toInstant()), companyId);
    }

    private List<CompanyDashboardResponse.TripMetric> loadRecentTrips(UUID companyId, boolean shipper) {
        String where = shipper ? "l.shipper_company_id=?" : "o.offerer_id=?";
        return jdbc.query("SELECT m.id,l.title,concat(l.pickup_city,', ',l.pickup_country,' → ',l.dropoff_city,', ',l.dropoff_country) route,o.driver_name,o.amount,o.currency,m.status,m.matched_at " +
                "FROM matches m JOIN loads l ON l.id=m.load_id JOIN offers o ON o.id=m.offer_id WHERE " + where + " ORDER BY m.matched_at DESC LIMIT 20",
                (rs, row) -> new CompanyDashboardResponse.TripMetric((UUID) rs.getObject("id"), rs.getString("title"), rs.getString("route"),
                        rs.getString("driver_name"), rs.getBigDecimal("amount"), rs.getString("currency"), rs.getString("status"),
                        rs.getTimestamp("matched_at").toInstant()), companyId);
    }

    private long count(String sql, UUID companyId) {
        Long value = jdbc.queryForObject(sql, Long.class, companyId);
        return value == null ? 0 : value;
    }

    private BigDecimal money(String sql, UUID companyId) {
        BigDecimal value = jdbc.queryForObject(sql, BigDecimal.class, companyId);
        return value == null ? BigDecimal.ZERO : value;
    }
}
