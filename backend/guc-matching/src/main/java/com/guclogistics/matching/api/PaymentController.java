package com.guclogistics.matching.api;

import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments")
@RequiredArgsConstructor
public class PaymentController {
    private final JdbcTemplate jdbc;

    @GetMapping("/ledger")
    public List<LedgerItem> ledger(@AuthenticationPrincipal AuthenticatedUser user) {
        return jdbc.query("SELECT id,match_id,amount,currency,kind,status,provider_reference,created_at FROM payment_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 100",
                (rs, row) -> new LedgerItem((UUID)rs.getObject("id"),(UUID)rs.getObject("match_id"),rs.getBigDecimal("amount"),rs.getString("currency"),rs.getString("kind"),rs.getString("status"),rs.getString("provider_reference"),rs.getTimestamp("created_at").toInstant()), user.userId());
    }

    @PostMapping("/matches/{matchId}/hold")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public LedgerItem hold(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID matchId, @Valid @RequestBody HoldRequest request) {
        requireShipper(matchId, user.userId());UUID id=UUID.randomUUID();Instant now=Instant.now();
        jdbc.update("INSERT INTO payment_ledger(id,match_id,user_id,amount,currency,kind,status,provider_reference,created_at) VALUES(?,?,?,?,?,'HOLD','PENDING_PROVIDER',?,?)",
                id,matchId,user.userId(),request.amount(),request.currency().toUpperCase(),request.providerReference(),now);
        return new LedgerItem(id,matchId,request.amount(),request.currency().toUpperCase(),"HOLD","PENDING_PROVIDER",request.providerReference(),now);
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LedgerItem confirm(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id, @RequestBody ProviderConfirmation request) {
        int updated=jdbc.update("UPDATE payment_ledger SET status='SECURED',provider_reference=? WHERE id=? AND kind='HOLD'",request.providerReference(),id);
        if(updated==0)throw DomainException.notFound("Payment hold not found");
        return jdbc.queryForObject("SELECT id,match_id,amount,currency,kind,status,provider_reference,created_at FROM payment_ledger WHERE id=?",
                (rs,row)->new LedgerItem((UUID)rs.getObject("id"),(UUID)rs.getObject("match_id"),rs.getBigDecimal("amount"),rs.getString("currency"),rs.getString("kind"),rs.getString("status"),rs.getString("provider_reference"),rs.getTimestamp("created_at").toInstant()),id);
    }

    private void requireShipper(UUID matchId, UUID userId) {
        Long count=jdbc.queryForObject("""
                SELECT COUNT(*) FROM matches m JOIN loads l ON l.id=m.load_id
                WHERE m.id=? AND (l.created_by_user_id=? OR EXISTS (
                  SELECT 1 FROM company_members cm WHERE cm.company_id=l.shipper_company_id
                  AND cm.user_id=? AND cm.member_role IN ('OWNER','ADMIN')
                ))
                """,Long.class,matchId,userId,userId);
        if(count==null||count==0)throw DomainException.forbidden("Only the shipment owner can secure payment");
    }

    public record HoldRequest(@DecimalMin("0.01") BigDecimal amount,@NotBlank @Size(min=3,max=3) String currency,@Size(max=160) String providerReference){}
    public record ProviderConfirmation(@Size(max=160) String providerReference){}
    public record LedgerItem(UUID id,UUID matchId,BigDecimal amount,String currency,String kind,String status,String providerReference,Instant createdAt){}
}
