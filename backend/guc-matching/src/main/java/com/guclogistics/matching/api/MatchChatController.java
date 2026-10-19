package com.guclogistics.matching.api;

import com.guclogistics.matching.application.MatchChatService;
import com.guclogistics.matching.application.dto.ChatMessageResponse;
import com.guclogistics.matching.application.dto.SendChatMessageRequest;
import com.guclogistics.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/matches/{matchId}/messages")
@Tag(name = "Match chat")
@RequiredArgsConstructor
public class MatchChatController {
    private final MatchChatService chatService;

    @GetMapping
    public List<ChatMessageResponse> list(
            @PathVariable UUID matchId,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return chatService.list(matchId, user.userId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse send(
            @PathVariable UUID matchId,
            @Valid @RequestBody SendChatMessageRequest body,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return chatService.send(matchId, user.userId(), body.body());
    }
}
