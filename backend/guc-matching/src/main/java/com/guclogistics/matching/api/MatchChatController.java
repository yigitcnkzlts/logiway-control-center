package com.guclogistics.matching.api;

import com.guclogistics.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lightweight in-memory match chat until a dedicated messaging module exists.
 * Supports Flutter polling via GET/POST /api/v1/matches/{id}/messages.
 */
@RestController
@RequestMapping("/api/v1/matches/{matchId}/messages")
@Tag(name = "Match chat")
public class MatchChatController {

    private final Map<UUID, List<ChatMessageDto>> store = new ConcurrentHashMap<>();

    @GetMapping
    public List<ChatMessageDto> list(
            @PathVariable UUID matchId,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return List.copyOf(store.getOrDefault(matchId, List.of()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageDto send(
            @PathVariable UUID matchId,
            @RequestBody SendMessageRequest body,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        if (body == null || body.body() == null || body.body().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body required");
        }
        var msg = new ChatMessageDto(
                UUID.randomUUID(),
                matchId,
                user.userId(),
                body.senderRole() == null || body.senderRole().isBlank() ? "SHIPPER" : body.senderRole(),
                body.body().trim(),
                Instant.now()
        );
        store.compute(matchId, (id, list) -> {
            List<ChatMessageDto> next = list == null ? new ArrayList<>() : new ArrayList<>(list);
            next.add(msg);
            return next;
        });
        return msg;
    }

    public record SendMessageRequest(String body, String senderRole) {
    }

    public record ChatMessageDto(
            UUID id,
            UUID matchId,
            UUID senderUserId,
            String senderRole,
            String body,
            Instant createdAt
    ) {
    }
}
