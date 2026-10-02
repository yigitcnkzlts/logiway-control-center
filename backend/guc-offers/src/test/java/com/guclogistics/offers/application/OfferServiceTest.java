package com.guclogistics.offers.application;

import com.guclogistics.offers.application.dto.CreateOfferRequest;
import com.guclogistics.offers.domain.OfferStatus;
import com.guclogistics.offers.domain.OffererType;
import com.guclogistics.offers.infrastructure.persistence.OfferEntity;
import com.guclogistics.offers.infrastructure.persistence.OfferJpaRepository;
import com.guclogistics.shared.event.DomainEventPublisher;
import com.guclogistics.shared.events.offers.OfferAcceptedEvent;
import com.guclogistics.shared.events.offers.OfferRejectedEvent;
import com.guclogistics.shared.events.offers.OfferSubmittedEvent;
import com.guclogistics.shared.exception.DomainException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OfferServiceTest {

    @Mock private OfferJpaRepository offerRepository;
    @Mock private DomainEventPublisher eventPublisher;
    @Mock private EntityManager entityManager;

    @InjectMocks
    private OfferService offerService;

    @BeforeEach
    void setUpEntityManager() {
        lenient().when(entityManager.createNativeQuery(anyString())).thenAnswer(inv -> {
            String sql = inv.getArgument(0);
            Query query = mock(Query.class);
            lenient().when(query.setParameter(anyInt(), any())).thenReturn(query);
            if (sql.contains("SELECT id, status")) {
                when(query.getSingleResult()).thenReturn(new Object[]{
                        currentLoadId, currentLoadStatus, currentLoadOwner, currentLoadVersion, currentShipperCompanyId});
            } else if (sql.contains("UPDATE loads")) {
                when(query.executeUpdate()).thenReturn(1);
            } else if (sql.contains("SELECT id FROM driver_profiles")) {
                when(query.getSingleResult()).thenReturn(currentDriverProfileId);
            } else if (sql.contains("FROM vehicles WHERE id")) {
                when(query.getSingleResult()).thenReturn(new Object[]{
                        currentVehicleId, "COMPANY", currentOffererCompanyId, "34 GUC 123", "CURTAINSIDER", "ACTIVE"});
            } else if (sql.contains("FROM driver_profiles d JOIN users")) {
                when(query.getSingleResult()).thenReturn(new Object[]{
                        currentDriverProfileId, currentDriverUserId, currentOffererCompanyId, "VERIFIED",
                        "driver@guclogistics.com", "+905551112233"});
            } else if (sql.contains("shipper ownership check")) {
                when(query.getSingleResult()).thenReturn(currentShipperMembershipCount);
            } else if (sql.contains("SELECT COUNT(*)")) {
                when(query.getSingleResult()).thenReturn(currentMembershipCount);
            }
            return query;
        });
    }

    private UUID currentLoadId = UUID.randomUUID();
    private String currentLoadStatus = "PUBLISHED";
    private UUID currentLoadOwner = UUID.randomUUID();
    private long currentLoadVersion = 1L;
    private UUID currentShipperCompanyId = UUID.randomUUID();
    private UUID currentDriverProfileId = UUID.randomUUID();
    private UUID currentDriverUserId = UUID.randomUUID();
    private UUID currentVehicleId = UUID.randomUUID();
    private UUID currentOffererCompanyId = UUID.randomUUID();
    private long currentMembershipCount = 1L;
    private long currentShipperMembershipCount = 0L;

    @Test
    void submitOfferForPublishedLoad() {
        UUID loadId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        currentLoadId = loadId;
        currentLoadStatus = "PUBLISHED";

        UUID vehicleId = currentVehicleId;
        currentOffererCompanyId = UUID.randomUUID();
        CreateOfferRequest request = new CreateOfferRequest(
                OffererType.COMPANY, currentOffererCompanyId, BigDecimal.valueOf(500), "eur", "hello", null,
                vehicleId, currentDriverProfileId, null, null, null, null, 18, null);

        when(offerRepository.save(any(OfferEntity.class))).thenAnswer(inv -> {
            OfferEntity offer = inv.getArgument(0);
            offer.setId(UUID.randomUUID());
            return offer;
        });

        var response = offerService.submitOffer(loadId, userId, request);

        assertThat(response.status()).isEqualTo(OfferStatus.PENDING);
        assertThat(response.currency()).isEqualTo("EUR");
        assertThat(response.vehicleId()).isEqualTo(vehicleId);
        assertThat(response.vehiclePlate()).isEqualTo("34 GUC 123");
        assertThat(response.driverName()).isEqualTo("driver");
        assertThat(response.estimatedTransitHours()).isEqualTo(18);
        verify(eventPublisher).publish(any(OfferSubmittedEvent.class));
    }

    @Test
    void submitOfferForDraftLoadFails() {
        UUID loadId = UUID.randomUUID();
        currentLoadId = loadId;
        currentLoadStatus = "DRAFT";

        assertThatThrownBy(() -> offerService.submitOffer(loadId, UUID.randomUUID(),
                new CreateOfferRequest(OffererType.DRIVER, null, BigDecimal.TEN, "EUR", null, null)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("published loads");
    }

    @Test
    void submitDuplicateOfferConflict() {
        UUID loadId = UUID.randomUUID();
        currentLoadId = loadId;
        when(offerRepository.save(any(OfferEntity.class)))
                .thenThrow(new DataIntegrityViolationException("dup"));

        assertThatThrownBy(() -> offerService.submitOffer(loadId, UUID.randomUUID(),
                new CreateOfferRequest(OffererType.COMPANY, currentOffererCompanyId, BigDecimal.TEN, "EUR", null, null,
                        currentVehicleId, currentDriverProfileId, null, null, null, null, null, null)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("pending offer already exists");
    }

    @Test
    void submitCompanyOfferWithoutMembershipForbidden() {
        UUID loadId = UUID.randomUUID();
        currentLoadId = loadId;
        currentMembershipCount = 0L;

        assertThatThrownBy(() -> offerService.submitOffer(loadId, UUID.randomUUID(),
                new CreateOfferRequest(OffererType.COMPANY, UUID.randomUUID(), BigDecimal.TEN, "EUR", null, null)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("not a member");
    }

    @Test
    void submitCompanyOfferWithoutOffererIdFails() {
        UUID loadId = UUID.randomUUID();
        currentLoadId = loadId;

        assertThatThrownBy(() -> offerService.submitOffer(loadId, UUID.randomUUID(),
                new CreateOfferRequest(OffererType.COMPANY, null, BigDecimal.TEN, "EUR", null, null)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("offererId is required");
    }

    @Test
    void loadOwnerCannotSubmitOwnOffer() {
        UUID ownerId = UUID.randomUUID();
        currentLoadOwner = ownerId;

        assertThatThrownBy(() -> offerService.submitOffer(currentLoadId, ownerId,
                new CreateOfferRequest(OffererType.DRIVER, null, BigDecimal.TEN, "EUR", null, null)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("own loads");
    }

    @Test
    void shipperCompanyMemberCannotSubmitOwnOffer() {
        currentShipperMembershipCount = 1L;

        assertThatThrownBy(() -> offerService.submitOffer(currentLoadId, UUID.randomUUID(),
                new CreateOfferRequest(OffererType.DRIVER, null, BigDecimal.TEN, "EUR", null, null)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Shipper company members");
    }

    @Test
    void acceptByNonOwnerForbidden() {
        UUID offerId = UUID.randomUUID();
        UUID loadId = UUID.randomUUID();
        UUID loadOwnerId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        currentLoadId = loadId;
        currentLoadOwner = loadOwnerId;
        currentMembershipCount = 0L;

        OfferEntity offer = pendingOffer(offerId, loadId, otherUserId);
        when(offerRepository.findById(offerId)).thenReturn(Optional.of(offer));

        assertThatThrownBy(() -> offerService.accept(offerId, otherUserId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("load company");

    }

    @Test
    void otherCompanyCannotReadPrivateLoadOffers() {
        currentMembershipCount = 0L;
        assertThatThrownBy(() -> offerService.listForLoad(currentLoadId, UUID.randomUUID()))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("access denied");
    }

    @Test
    void acceptPendingOfferPublishesEvent() {
        UUID offerId = UUID.randomUUID();
        UUID loadId = UUID.randomUUID();
        UUID loadOwnerId = UUID.randomUUID();
        currentLoadId = loadId;
        currentLoadOwner = loadOwnerId;
        currentLoadStatus = "PUBLISHED";

        OfferEntity offer = pendingOffer(offerId, loadId, UUID.randomUUID());
        when(offerRepository.findById(offerId)).thenReturn(Optional.of(offer));
        when(offerRepository.save(offer)).thenReturn(offer);

        var response = offerService.accept(offerId, loadOwnerId);

        assertThat(response.status()).isEqualTo(OfferStatus.ACCEPTED);
        verify(eventPublisher).publish(any(OfferAcceptedEvent.class));
        verify(offerRepository).rejectOtherPendingOffers(loadId, offerId);
    }

    @Test
    void rejectPendingOfferPublishesEvent() {
        UUID offerId = UUID.randomUUID();
        UUID loadId = UUID.randomUUID();
        UUID loadOwnerId = UUID.randomUUID();
        currentLoadId = loadId;
        currentLoadOwner = loadOwnerId;

        OfferEntity offer = pendingOffer(offerId, loadId, UUID.randomUUID());
        when(offerRepository.findById(offerId)).thenReturn(Optional.of(offer));
        when(offerRepository.save(offer)).thenReturn(offer);

        var response = offerService.reject(offerId, loadOwnerId);

        assertThat(response.status()).isEqualTo(OfferStatus.REJECTED);
        verify(eventPublisher).publish(any(OfferRejectedEvent.class));
    }

    @Test
    void withdrawByNonOffererForbidden() {
        UUID offerId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();

        when(offerRepository.findByIdAndCreatedByUserId(offerId, otherUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> offerService.withdraw(offerId, otherUserId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("access denied");
    }

    @Test
    void withdrawPendingOffer() {
        UUID offerId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        OfferEntity offer = pendingOffer(offerId, UUID.randomUUID(), userId);

        when(offerRepository.findByIdAndCreatedByUserId(offerId, userId)).thenReturn(Optional.of(offer));
        when(offerRepository.save(offer)).thenReturn(offer);

        var response = offerService.withdraw(offerId, userId);

        assertThat(response.status()).isEqualTo(OfferStatus.WITHDRAWN);
    }

    @Test
    void loadNotFoundWhenSubmitting() {
        lenient().when(entityManager.createNativeQuery(anyString())).thenAnswer(inv -> {
            Query query = mock(Query.class);
            lenient().when(query.setParameter(anyInt(), any())).thenReturn(query);
            when(query.getSingleResult()).thenThrow(new NoResultException());
            return query;
        });

        assertThatThrownBy(() -> offerService.submitOffer(UUID.randomUUID(), UUID.randomUUID(),
                new CreateOfferRequest(OffererType.DRIVER, null, BigDecimal.TEN, "EUR", null, null)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Load not found");
    }

    private OfferEntity pendingOffer(UUID offerId, UUID loadId, UUID createdBy) {
        OfferEntity offer = new OfferEntity();
        offer.setId(offerId);
        offer.setLoadId(loadId);
        offer.setCreatedByUserId(createdBy);
        offer.setOffererId(createdBy);
        offer.setOffererType(OffererType.DRIVER);
        offer.setAmount(BigDecimal.valueOf(100));
        offer.setCurrency("EUR");
        offer.setStatus(OfferStatus.PENDING);
        return offer;
    }
}
