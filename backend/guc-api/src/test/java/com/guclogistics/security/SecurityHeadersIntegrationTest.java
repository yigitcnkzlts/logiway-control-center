package com.guclogistics.security;

import com.guclogistics.shared.web.SecurityHeadersFilter;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SecurityHeadersIntegrationTest {

    @Test
    void securityHeadersAppliedViaFilterInMockMvcChain() throws Exception {
        var mockMvc = MockMvcBuilders.standaloneSetup(new PingController())
                .addFilters(new SecurityHeadersFilter(false))
                .build();

        mockMvc.perform(get("/ping"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    @RestController
    static class PingController {
        @GetMapping("/ping")
        String ping() {
            return "ok";
        }
    }
}
