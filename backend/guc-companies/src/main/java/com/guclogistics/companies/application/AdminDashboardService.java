package com.guclogistics.companies.application;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    private static final Locale TR = Locale.forLanguageTag("tr-TR");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d MMM yyyy", TR).withZone(ZoneId.of("Europe/Istanbul"));
    private final JdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public Map<String, Object> overview() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("months", months());
        response.put("companies", companies());
        response.put("users", users());
        response.put("trips", trips());
        response.put("alerts", alerts());
        return response;
    }

    private List<Map<String, Object>> months() {
        return jdbc.query("""
                SELECT month_start,
                  (SELECT COUNT(*) FROM loads l WHERE date_trunc('month',l.created_at)=month_start) loads,
                  (SELECT COUNT(*) FROM matches m WHERE date_trunc('month',m.matched_at)=month_start) trips,
                  (SELECT COALESCE(SUM(o.amount),0) FROM matches m JOIN offers o ON o.id=m.offer_id
                    WHERE date_trunc('month',m.matched_at)=month_start AND m.status IN ('ACTIVE','COMPLETED')) gmv,
                  (SELECT COUNT(*) FROM users u WHERE date_trunc('month',u.created_at)=month_start) new_users,
                  (SELECT COUNT(*) FROM matches m WHERE date_trunc('month',m.matched_at)=month_start AND m.status='COMPLETED') completed
                FROM generate_series(date_trunc('month',CURRENT_DATE)-interval '11 months',date_trunc('month',CURRENT_DATE),interval '1 month') month_start
                ORDER BY month_start
                """, (rs, row) -> {
            var month = rs.getTimestamp("month_start").toInstant();
            long trips = rs.getLong("trips");
            long completed = rs.getLong("completed");
            BigDecimal gmv = rs.getBigDecimal("gmv");
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("key", DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneId.of("UTC")).format(month));
            item.put("label", DateTimeFormatter.ofPattern("MMMM yyyy", TR).withZone(ZoneId.of("Europe/Istanbul")).format(month));
            item.put("loads", rs.getLong("loads"));
            item.put("trips", trips);
            item.put("gmv", gmv);
            item.put("revenue", gmv.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP));
            item.put("newUsers", rs.getLong("new_users"));
            item.put("onTime", trips == 0 ? 0 : Math.round(completed * 100.0 / trips));
            return item;
        });
    }

    private List<Map<String, Object>> companies() {
        return jdbc.query("""
                SELECT c.id,c.type,c.legal_name,c.trade_name,c.country,c.status,c.created_at,
                  (SELECT COUNT(*) FROM company_members cm WHERE cm.company_id=c.id) members,
                  (SELECT COUNT(*) FROM vehicles v WHERE v.owner_id=c.id) vehicles,
                  CASE WHEN c.type='SHIPPER'
                    THEN (SELECT COUNT(*) FROM matches m JOIN loads l ON l.id=m.load_id WHERE l.shipper_company_id=c.id)
                    ELSE (SELECT COUNT(*) FROM matches m JOIN offers o ON o.id=m.offer_id WHERE o.offerer_id=c.id) END trips,
                  CASE WHEN c.type='SHIPPER'
                    THEN (SELECT COALESCE(SUM(o.amount),0) FROM matches m JOIN loads l ON l.id=m.load_id JOIN offers o ON o.id=m.offer_id WHERE l.shipper_company_id=c.id)
                    ELSE (SELECT COALESCE(SUM(o.amount),0) FROM matches m JOIN offers o ON o.id=m.offer_id WHERE o.offerer_id=c.id) END volume
                FROM companies c ORDER BY c.created_at DESC LIMIT 250
                """, (rs, row) -> Map.ofEntries(
                Map.entry("id", shortId("CO", (UUID) rs.getObject("id"))),
                Map.entry("name", rs.getString("trade_name") == null ? rs.getString("legal_name") : rs.getString("trade_name")),
                Map.entry("type", companyType(rs.getString("type"))), Map.entry("country", rs.getString("country")),
                Map.entry("status", status(rs.getString("status"))), Map.entry("members", rs.getLong("members")),
                Map.entry("vehicles", rs.getLong("vehicles")), Map.entry("trips", rs.getLong("trips")),
                Map.entry("volume", euro(rs.getBigDecimal("volume"))), Map.entry("joined", DATE.format(rs.getTimestamp("created_at").toInstant()))));
    }

    private List<Map<String, Object>> users() {
        return jdbc.query("""
                SELECT u.id,u.email,u.status,u.created_at,c.trade_name,c.legal_name,c.country,
                  COALESCE(string_agg(DISTINCT r.name,', '),'USER') roles
                FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
                  LEFT JOIN company_members cm ON cm.user_id=u.id LEFT JOIN companies c ON c.id=cm.company_id
                GROUP BY u.id,u.email,u.status,u.created_at,c.trade_name,c.legal_name,c.country
                ORDER BY u.created_at DESC LIMIT 500
                """, (rs, row) -> {
            String email = rs.getString("email");
            String company = rs.getString("trade_name");
            if (company == null) company = rs.getString("legal_name");
            return Map.ofEntries(Map.entry("id", shortId("USR", (UUID) rs.getObject("id"))),
                    Map.entry("name", email.substring(0, email.indexOf('@')).replace('.', ' ')), Map.entry("email", email),
                    Map.entry("role", role(rs.getString("roles"))), Map.entry("company", company == null ? "Bağımsız" : company),
                    Map.entry("country", rs.getString("country") == null ? "—" : rs.getString("country")),
                    Map.entry("status", status(rs.getString("status"))), Map.entry("joined", DATE.format(rs.getTimestamp("created_at").toInstant())),
                    Map.entry("createdAt", rs.getTimestamp("created_at").toInstant().toString()));
        });
    }

    private List<Map<String, Object>> trips() {
        return jdbc.query("""
                SELECT m.id,m.status,m.matched_at,l.pickup_city,l.dropoff_city,
                  COALESCE(sc.trade_name,sc.legal_name) shipper,COALESCE(cc.trade_name,cc.legal_name) carrier,o.driver_name,o.amount,o.currency
                FROM matches m JOIN loads l ON l.id=m.load_id JOIN companies sc ON sc.id=l.shipper_company_id
                  JOIN offers o ON o.id=m.offer_id LEFT JOIN companies cc ON cc.id=o.offerer_id
                ORDER BY m.matched_at DESC LIMIT 500
                """, (rs, row) -> {
            BigDecimal amount = rs.getBigDecimal("amount");
            var matchedAt = rs.getTimestamp("matched_at").toInstant();
            return Map.ofEntries(Map.entry("id", shortId("TR", (UUID) rs.getObject("id"))),
                    Map.entry("month", DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneId.of("UTC")).format(matchedAt)),
                    Map.entry("route", rs.getString("pickup_city") + " → " + rs.getString("dropoff_city")),
                    Map.entry("shipper", rs.getString("shipper")), Map.entry("carrier", rs.getString("carrier") == null ? "Bağımsız şoför" : rs.getString("carrier")),
                    Map.entry("driver", rs.getString("driver_name") == null ? "Atanmadı" : rs.getString("driver_name")),
                    Map.entry("status", tripStatus(rs.getString("status"))), Map.entry("amount", euro(amount)),
                    Map.entry("margin", euro(amount.multiply(new BigDecimal("0.05")))), Map.entry("date", DATE.format(matchedAt)));
        });
    }

    private List<Map<String, Object>> alerts() {
        long pending = number("SELECT COUNT(*) FROM companies WHERE status='PENDING'");
        long pendingVerification = number("SELECT COUNT(*) FROM verification_applications WHERE status='SUBMITTED'");
        long openLoads = number("SELECT COUNT(*) FROM loads WHERE status='PUBLISHED'");
        return List.of(
                alert(pending > 0 ? "warning" : "good", pending + " firma doğrulama bekliyor", "Yönetici incelemesi gereken şirket kayıtları."),
                alert(pendingVerification > 0 ? "critical" : "good", pendingVerification + " belge doğrulaması inceleniyor", "Kimlik, ehliyet ve şirket belgeleri için inceleme kuyruğu."),
                alert("good", openLoads + " açık yük eşleşme bekliyor", "Canlı pazardaki yayınlanmış ilanlar."));
    }

    private long number(String sql) { Long value = jdbc.queryForObject(sql, Long.class); return value == null ? 0 : value; }
    private Map<String, Object> alert(String tone, String title, String text) { return Map.of("tone", tone, "title", title, "text", text); }
    private String shortId(String prefix, UUID id) { return prefix + "-" + id.toString().substring(0, 8).toUpperCase(); }
    private String euro(BigDecimal amount) { return String.format(TR, "%,.0f €", amount == null ? BigDecimal.ZERO : amount); }
    private String companyType(String type) { return "SHIPPER".equals(type) ? "Yük veren" : "LOGISTICS_COMPANY".equals(type) ? "Lojistik firması" : "Filo sahibi"; }
    private String role(String roles) { return roles.contains("ADMIN") ? "Yönetici" : roles.contains("SHIPPER") ? "Yük veren" : roles.contains("LOGISTICS") ? "Filo yöneticisi" : roles.contains("DRIVER") ? "Şoför" : roles; }
    private String status(String value) { return "VERIFIED".equals(value) ? "Doğrulandı" : "ACTIVE".equals(value) ? "Aktif" : "PENDING".equals(value) ? "İnceleniyor" : value; }
    private String tripStatus(String value) { return "COMPLETED".equals(value) ? "Tamamlandı" : "CANCELLED".equals(value) ? "İptal" : "Aktif"; }
}
