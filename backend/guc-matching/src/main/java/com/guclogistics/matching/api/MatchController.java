package com.guclogistics.matching.api;

import com.guclogistics.matching.application.MatchService;
import com.guclogistics.matching.application.MatchDetailService;
import com.guclogistics.matching.application.dto.MatchDetailResponse;
import com.guclogistics.matching.application.dto.MatchResponse;
import com.guclogistics.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
@RequestMapping("/api/v1/matches")
@Tag(name = "Matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;
    private final MatchDetailService matchDetailService;

    @GetMapping
    public List<MatchResponse> listMine(@AuthenticationPrincipal AuthenticatedUser user) {
        return matchService.listForUser(user.userId());
    }

    @GetMapping("/{id}")
    public MatchDetailResponse detail(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable java.util.UUID id) {
        return matchDetailService.get(id, user.userId());
    }
}
