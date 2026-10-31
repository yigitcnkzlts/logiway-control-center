package com.guclogistics;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guclogistics.companies.domain.event.CompanyCreatedEvent;
import com.guclogistics.identity.domain.event.SessionRevokedEvent;
import com.guclogistics.identity.domain.event.SuspiciousLoginDetectedEvent;
import com.guclogistics.identity.domain.event.UserLoggedInEvent;
import com.guclogistics.identity.domain.event.UserRegisteredEvent;
import com.guclogistics.shared.domain.DomainEvent;
import com.guclogistics.shared.events.identity.UserCompanyRegistrationRequestedEvent;
import com.guclogistics.shared.events.loads.LoadPublishedEvent;
import com.guclogistics.shared.events.matching.MatchCreatedEvent;
import com.guclogistics.shared.events.offers.OfferAcceptedEvent;
import com.guclogistics.shared.events.offers.OfferRejectedEvent;
import com.guclogistics.shared.events.offers.OfferSubmittedEvent;
import com.guclogistics.shared.events.verification.VerificationApprovedEvent;
import com.guclogistics.shared.events.verification.VerificationRejectedEvent;
import com.guclogistics.shared.events.verification.VerificationSubmittedEvent;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class DomainEventSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void allConcreteDomainEventsSerializeWithMetadataAndPayload() throws Exception {
        UUID id = UUID.randomUUID();
        List<DomainEvent> events = List.of(
                new UserRegisteredEvent(id, "user@example.com", "SHIPPER"),
                new UserLoggedInEvent(id, UUID.randomUUID(), "127.0.0.1", true),
                new SessionRevokedEvent(id, UUID.randomUUID()),
                new SuspiciousLoginDetectedEvent(id, "127.0.0.1", "test"),
                new CompanyCreatedEvent(id, UUID.randomUUID(), "SHIPPER", "Acme"),
                new UserCompanyRegistrationRequestedEvent(id, "SHIPPER", "Acme", "TR"),
                new LoadPublishedEvent(id, UUID.randomUUID(), UUID.randomUUID(), "Load"),
                new MatchCreatedEvent(id, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()),
                new OfferAcceptedEvent(id, UUID.randomUUID(), UUID.randomUUID(), "COMPANY", UUID.randomUUID(), UUID.randomUUID()),
                new OfferRejectedEvent(id, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()),
                new OfferSubmittedEvent(id, UUID.randomUUID(), "COMPANY", UUID.randomUUID(), UUID.randomUUID(), BigDecimal.TEN, "TRY"),
                new VerificationSubmittedEvent(id, "COMPANY", UUID.randomUUID(), UUID.randomUUID()),
                new VerificationApprovedEvent(id, "COMPANY", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()),
                new VerificationRejectedEvent(id, "COMPANY", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "test")
        );

        for (DomainEvent event : events) {
            JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(event));
            assertThat(json.get("eventId")).as(event.eventType()).isNotNull();
            assertThat(json.get("occurredAt")).as(event.eventType()).isNotNull();
            assertThat(json.size()).as(event.eventType()).isGreaterThan(2);
        }
    }
}
