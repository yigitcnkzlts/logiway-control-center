package com.guclogistics.matching.api;

import com.guclogistics.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/devices")
@Tag(name = "Devices")
@RequiredArgsConstructor
public class DeviceController {
    private final JdbcTemplate jdbc;

    @PostMapping("/push-token")
    @Transactional
    public Map<String,Object> register(@AuthenticationPrincipal AuthenticatedUser user,@Valid @RequestBody PushTokenRequest request){
        jdbc.update("""
                INSERT INTO push_devices(id,user_id,token,platform,device_name) VALUES(?,?,?,?,?)
                ON CONFLICT(token) DO UPDATE SET user_id=EXCLUDED.user_id,platform=EXCLUDED.platform,device_name=EXCLUDED.device_name,enabled=TRUE,updated_at=NOW()
                """, UUID.randomUUID(),user.userId(),request.token(),request.platform(),request.deviceName());
        return Map.of("ok",true);
    }

    @DeleteMapping("/push-token")
    @Transactional
    public Map<String,Object> unregister(@AuthenticationPrincipal AuthenticatedUser user,@Valid @RequestBody PushTokenRequest request){
        jdbc.update("UPDATE push_devices SET enabled=FALSE,updated_at=NOW() WHERE user_id=? AND token=?",user.userId(),request.token());
        return Map.of("ok",true);
    }

    public record PushTokenRequest(@NotBlank @Size(max=512) String token,@NotBlank @Size(max=32) String platform,@Size(max=120) String deviceName){}
}
