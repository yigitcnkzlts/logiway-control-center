package com.guclogistics.loads.application;

import com.guclogistics.loads.application.dto.CreateLoadRequest;
import com.guclogistics.loads.application.dto.UpdateLoadRequest;
import com.guclogistics.loads.domain.LoadStatus;
import com.guclogistics.loads.infrastructure.persistence.LoadEntity;
import com.guclogistics.loads.infrastructure.persistence.LoadJpaRepository;
import com.guclogistics.loads.infrastructure.persistence.LoadStatusHistoryJpaRepository;
import com.guclogistics.shared.event.DomainEventPublisher;
import com.guclogistics.shared.events.loads.LoadPublishedEvent;
import com.guclogistics.shared.exception.DomainException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.Query;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoadServiceTest {

    @Mock
    private LoadJpaRepository loadRepository;
    @Mock
    private LoadStatusHistoryJpaRepository historyRepository;
    @Mock
    private DomainEventPublisher eventPublisher;
    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private LoadService loadService;

    @Test
    void createPersistsDraftLoad() {
        UUID userId = UUID.randomUUID();
        CreateLoadRequest request = createRequest(UUID.randomUUID());

        Query membershipQuery = mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(membershipQuery);
        when(membershipQuery.setParameter(anyInt(), any())).thenReturn(membershipQuery);
        when(membershipQuery.getSingleResult()).thenReturn(1L);
        when(loadRepository.save(any(LoadEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = loadService.create(userId, request);

        assertThat(response.status()).isEqualTo(LoadStatus.DRAFT);
        assertThat(response.pickupCountry()).isEqualTo("TR");
        verify(historyRepository).save(any());
    }

    @Test
    void createRejectsNonMemberCompany() {
        Query membershipQuery = mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(membershipQuery);
        when(membershipQuery.setParameter(anyInt(), any())).thenReturn(membershipQuery);
        when(membershipQuery.getSingleResult()).thenReturn(0L);

        assertThatThrownBy(() -> loadService.create(UUID.randomUUID(), createRequest(UUID.randomUUID())))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Only company members");
    }

    @Test
    void createRejectsInvalidDateRange() {
        UUID userId = UUID.randomUUID();
        Instant from = Instant.now().plusSeconds(7200);
        Instant to = Instant.now();
        CreateLoadRequest request = new CreateLoadRequest(
                UUID.randomUUID(), "Title", null, "tr", "Istanbul", null, null, null,
                "de", "Berlin", null, null, null, from, to,
                BigDecimal.TEN, null, null, "eur");

        assertThatThrownBy(() -> loadService.create(userId, request))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("ready_to must be after");
    }

    @Test
    void updateByNonOwnerForbidden() {
        UUID loadId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();

        LoadEntity load = draftLoad(loadId, UUID.randomUUID());
        when(loadRepository.findById(loadId)).thenReturn(Optional.of(load));
        mockMembership(0L);

        UpdateLoadRequest request = new UpdateLoadRequest(
                "Title", null, null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null);

        assertThatThrownBy(() -> loadService.update(loadId, otherUserId, request))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("access denied");
    }

    @Test
    void updateDraftLoadAppliesChanges() {
        UUID loadId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        LoadEntity load = draftLoad(loadId, userId);

        when(loadRepository.findById(loadId)).thenReturn(Optional.of(load));
        when(loadRepository.save(load)).thenReturn(load);

        var response = loadService.update(loadId, userId, new UpdateLoadRequest(
                "Updated", null, "de", null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null));

        assertThat(response.title()).isEqualTo("Updated");
        assertThat(response.pickupCountry()).isEqualTo("DE");
    }

    @Test
    void updateNonDraftLoadFails() {
        UUID loadId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        LoadEntity load = draftLoad(loadId, userId);
        load.setStatus(LoadStatus.PUBLISHED);

        when(loadRepository.findById(loadId)).thenReturn(Optional.of(load));

        assertThatThrownBy(() -> loadService.update(loadId, userId, new UpdateLoadRequest(
                "Updated", null, null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Only draft loads");
    }

    @Test
    void getDraftByNonOwnerForbidden() {
        UUID loadId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        LoadEntity load = draftLoad(loadId, ownerId);

        when(loadRepository.findById(loadId)).thenReturn(Optional.of(load));
        mockMembership(0L);

        assertThatThrownBy(() -> loadService.getById(loadId, UUID.randomUUID()))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    void getPublishedLoadVisibleToOthers() {
        UUID loadId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        LoadEntity load = draftLoad(loadId, ownerId);
        load.setStatus(LoadStatus.PUBLISHED);

        when(loadRepository.findById(loadId)).thenReturn(Optional.of(load));

        assertThat(loadService.getById(loadId, UUID.randomUUID()).status()).isEqualTo(LoadStatus.PUBLISHED);
    }

    @Test
    void publishVerifiedCompanyLoadPublishesEvent() {
        UUID loadId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        LoadEntity load = draftLoad(loadId, userId);

        when(loadRepository.findById(loadId)).thenReturn(Optional.of(load));
        when(loadRepository.save(load)).thenReturn(load);
        mockCompanyStatus(load.getShipperCompanyId(), "VERIFIED");

        var response = loadService.publish(loadId, userId);

        assertThat(response.status()).isEqualTo(LoadStatus.PUBLISHED);
        verify(eventPublisher).publish(any(LoadPublishedEvent.class));
        verify(historyRepository).save(any());
    }

    @Test
    void publishUnverifiedCompanyFails() {
        UUID loadId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        LoadEntity load = draftLoad(loadId, userId);

        when(loadRepository.findById(loadId)).thenReturn(Optional.of(load));
        mockCompanyStatus(load.getShipperCompanyId(), "PENDING");

        assertThatThrownBy(() -> loadService.publish(loadId, userId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("must be verified");
    }

    @Test
    void cancelPublishedLoadRecordsCancelledStatus() {
        UUID loadId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        LoadEntity load = draftLoad(loadId, userId);
        load.setStatus(LoadStatus.PUBLISHED);

        when(loadRepository.findById(loadId)).thenReturn(Optional.of(load));
        when(loadRepository.save(load)).thenReturn(load);

        var response = loadService.cancel(loadId, userId);

        assertThat(response.status()).isEqualTo(LoadStatus.CANCELLED);
        verify(historyRepository).save(any());
    }

    @Test
    void cancelMatchedLoadFails() {
        UUID loadId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        LoadEntity load = draftLoad(loadId, userId);
        load.setStatus(LoadStatus.MATCHED);

        when(loadRepository.findById(loadId)).thenReturn(Optional.of(load));

        assertThatThrownBy(() -> loadService.cancel(loadId, userId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Only draft or published");
    }

    @Test
    void publishMissingCompanyFails() {
        UUID loadId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        LoadEntity load = draftLoad(loadId, userId);

        when(loadRepository.findById(loadId)).thenReturn(Optional.of(load));
        Query query = mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(1, load.getShipperCompanyId())).thenReturn(query);
        when(query.getSingleResult()).thenThrow(new NoResultException());

        assertThatThrownBy(() -> loadService.publish(loadId, userId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Shipper company not found");
    }

    @Test
    void searchReturnsFilteredPage() {
        UUID userId = UUID.randomUUID();
        LoadEntity load = draftLoad(UUID.randomUUID(), userId);
        Page<LoadEntity> page = new PageImpl<>(List.of(load));

        when(loadRepository.searchVisibleLoads(
                eq(userId), eq(LoadStatus.PUBLISHED), eq("TR"), eq("DE"),
                any(), any(), any(Pageable.class))).thenReturn(page);

        var response = loadService.search(userId, LoadStatus.PUBLISHED, "tr", "de",
                BigDecimal.ONE, BigDecimal.TEN, 0, 20);

        assertThat(response.content()).hasSize(1);
    }

    private void mockCompanyStatus(UUID companyId, String status) {
        Query query = mock(Query.class);
        when(entityManager.createNativeQuery("SELECT status FROM companies WHERE id = ?1")).thenReturn(query);
        when(query.setParameter(1, companyId)).thenReturn(query);
        when(query.getSingleResult()).thenReturn(status);
    }

    @Test
    void companyMemberCanUpdateCompanyDraft() {
        UUID loadId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        LoadEntity load = draftLoad(loadId, UUID.randomUUID());
        when(loadRepository.findById(loadId)).thenReturn(Optional.of(load));
        mockMembership(1L);
        when(loadRepository.save(load)).thenReturn(load);

        var response = loadService.update(loadId, memberId, new UpdateLoadRequest(
                "Ekip güncellemesi", null, null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null));

        assertThat(response.title()).isEqualTo("Ekip güncellemesi");
    }

    private void mockMembership(long count) {
        Query query = mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyInt(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(count);
    }

    private static LoadEntity draftLoad(UUID loadId, UUID userId) {
        LoadEntity load = new LoadEntity();
        load.setId(loadId);
        load.setCreatedByUserId(userId);
        load.setStatus(LoadStatus.DRAFT);
        load.setShipperCompanyId(UUID.randomUUID());
        load.setTitle("Draft");
        load.setPickupCountry("TR");
        load.setPickupCity("Istanbul");
        load.setDropoffCountry("DE");
        load.setDropoffCity("Berlin");
        load.setReadyFrom(Instant.now());
        load.setReadyTo(Instant.now().plusSeconds(3600));
        load.setWeightKg(BigDecimal.TEN);
        load.setCurrency("EUR");
        return load;
    }

    private static CreateLoadRequest createRequest(UUID shipperCompanyId) {
        return new CreateLoadRequest(
                shipperCompanyId, "Title", "Desc", "tr", "Istanbul", null, null, null,
                "de", "Berlin", null, null, null,
                Instant.now(), Instant.now().plusSeconds(3600),
                BigDecimal.TEN, null, null, "eur");
    }
}
