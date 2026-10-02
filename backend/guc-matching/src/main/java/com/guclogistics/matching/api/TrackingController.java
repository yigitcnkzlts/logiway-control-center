package com.guclogistics.matching.api;

import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tracking")
@Tag(name = "Live Tracking")
@RequiredArgsConstructor
public class TrackingController {
    private final JdbcTemplate jdbc;

    @PostMapping("/matches/{matchId}/positions")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Position add(@AuthenticationPrincipal AuthenticatedUser user,@PathVariable UUID matchId,@Valid @RequestBody PositionRequest request){
        requireDriver(matchId,user.userId());UUID id=UUID.randomUUID();Instant captured=request.capturedAt()==null?Instant.now():request.capturedAt();
        jdbc.update("INSERT INTO vehicle_positions(id,match_id,user_id,latitude,longitude,accuracy_m,speed_kmh,heading,captured_at) VALUES(?,?,?,?,?,?,?,?,?)",
                id,matchId,user.userId(),request.latitude(),request.longitude(),request.accuracyM(),request.speedKmh(),request.heading(),captured);
        return new Position(id,matchId,request.latitude(),request.longitude(),request.accuracyM(),request.speedKmh(),request.heading(),captured);
    }

    @GetMapping("/matches/{matchId}/latest")
    public Position latest(@AuthenticationPrincipal AuthenticatedUser user,@PathVariable UUID matchId){
        requireParticipant(matchId,user.userId());
        return jdbc.query("SELECT id,match_id,latitude,longitude,accuracy_m,speed_kmh,heading,captured_at FROM vehicle_positions WHERE match_id=? ORDER BY captured_at DESC LIMIT 1",
                (rs,row)->new Position((UUID)rs.getObject("id"),(UUID)rs.getObject("match_id"),rs.getDouble("latitude"),rs.getDouble("longitude"),(Double)rs.getObject("accuracy_m"),(Double)rs.getObject("speed_kmh"),(Double)rs.getObject("heading"),rs.getTimestamp("captured_at").toInstant()),matchId)
                .stream().findFirst().orElseThrow(()->DomainException.notFound("Position not found"));
    }

    private void requireDriver(UUID matchId,UUID userId){Long count=jdbc.queryForObject("""
            SELECT COUNT(*) FROM matches m JOIN offers o ON o.id=m.offer_id
            JOIN driver_profiles dp ON dp.id=o.driver_profile_id
            WHERE m.id=? AND dp.user_id=?
            """,Long.class,matchId,userId);if(count==null||count==0)throw DomainException.forbidden("Only the assigned driver can update position");}
    private void requireParticipant(UUID matchId,UUID userId){Long count=jdbc.queryForObject("""
            SELECT COUNT(*) FROM matches m JOIN loads l ON l.id=m.load_id JOIN offers o ON o.id=m.offer_id
            WHERE m.id=? AND (l.created_by_user_id=? OR o.created_by_user_id=? OR EXISTS (
              SELECT 1 FROM company_members cm WHERE cm.user_id=?
              AND (cm.company_id=l.shipper_company_id OR
                (o.offerer_type='COMPANY' AND cm.company_id=o.offerer_id))
            ))
            """,Long.class,matchId,userId,userId,userId);if(count==null||count==0)throw DomainException.forbidden("Tracking access denied");}

    public record PositionRequest(@NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,@NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude,Double accuracyM,Double speedKmh,Double heading,Instant capturedAt){}
    public record Position(UUID id,UUID matchId,Double latitude,Double longitude,Double accuracyM,Double speedKmh,Double heading,Instant capturedAt){}
}
