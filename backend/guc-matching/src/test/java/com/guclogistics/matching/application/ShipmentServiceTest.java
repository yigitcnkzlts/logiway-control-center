package com.guclogistics.matching.application;

import com.guclogistics.matching.domain.ShipmentStatus;
import com.guclogistics.matching.infrastructure.persistence.ShipmentEntity;
import com.guclogistics.matching.infrastructure.persistence.ShipmentJpaRepository;
import com.guclogistics.matching.infrastructure.persistence.MatchEntity;
import com.guclogistics.matching.infrastructure.persistence.MatchJpaRepository;
import com.guclogistics.shared.exception.DomainException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShipmentServiceTest {
    @Mock ShipmentJpaRepository repository;
    @Mock MatchJpaRepository matchRepository;
    @Mock EntityManager entityManager;
    @InjectMocks ShipmentService service;

    @Test
    void duplicateActiveVehicleOrDriverIsRejected() {
        Query query=mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyInt(),any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(new Object[]{UUID.randomUUID(),"COMPANY",UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID()});
        when(repository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("active assignment"));

        assertThatThrownBy(()->service.createForMatch(UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID()))
                .isInstanceOf(DomainException.class).hasMessageContaining("active shipment");
    }

    @Test
    void invalidStatusTransitionIsRejected() {
        UUID userId=UUID.randomUUID();
        ShipmentEntity shipment=new ShipmentEntity();
        shipment.setId(UUID.randomUUID());shipment.setShipperCompanyId(UUID.randomUUID());
        shipment.setCarrierCompanyId(UUID.randomUUID());shipment.setDriverProfileId(UUID.randomUUID());
        shipment.setStatus(ShipmentStatus.ASSIGNED);
        when(repository.findById(shipment.getId())).thenReturn(Optional.of(shipment));
        mockTransitionActor("CARRIER");
        assertThatThrownBy(()->service.transition(shipment.getId(),userId,ShipmentStatus.DELIVERED))
                .isInstanceOf(DomainException.class).hasMessageContaining("Invalid shipment status");
    }

    @Test
    void shipperMemberCannotAdvanceOperationalShipmentStatus() {
        UUID userId = UUID.randomUUID();
        ShipmentEntity shipment = shipmentAt(ShipmentStatus.ASSIGNED);
        when(repository.findById(shipment.getId())).thenReturn(Optional.of(shipment));
        mockTransitionActor("SHIPPER");

        assertThatThrownBy(() -> service.transition(shipment.getId(), userId, ShipmentStatus.PICKED_UP))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("assigned driver or carrier");
        verify(repository, never()).save(any());
    }

    @Test
    void assignedDriverCanAdvanceOperationalShipmentStatus() {
        UUID userId = UUID.randomUUID();
        ShipmentEntity shipment = shipmentAt(ShipmentStatus.ASSIGNED);
        when(repository.findById(shipment.getId())).thenReturn(Optional.of(shipment));
        when(repository.save(shipment)).thenReturn(shipment);
        mockTransitionActor("DRIVER");

        service.transition(shipment.getId(), userId, ShipmentStatus.PICKED_UP);

        org.assertj.core.api.Assertions.assertThat(shipment.getStatus()).isEqualTo(ShipmentStatus.PICKED_UP);
        verify(repository).save(shipment);
    }

    @Test
    void ordinaryCarrierMemberCannotCancelShipment() {
        UUID userId = UUID.randomUUID();
        ShipmentEntity shipment = shipmentAt(ShipmentStatus.ASSIGNED);
        when(repository.findById(shipment.getId())).thenReturn(Optional.of(shipment));
        mockTransitionActor("CARRIER");

        assertThatThrownBy(() -> service.transition(shipment.getId(), userId, ShipmentStatus.CANCELLED))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("manager");
    }

    @Test
    void listsOnlyShipmentsReturnedByTheParticipantScopedQuery() {
        UUID userId = UUID.randomUUID();
        ShipmentEntity shipment = new ShipmentEntity();
        shipment.setId(UUID.randomUUID());
        shipment.setLoadId(UUID.randomUUID());
        shipment.setAcceptedOfferId(UUID.randomUUID());
        shipment.setMatchId(UUID.randomUUID());
        shipment.setShipperCompanyId(UUID.randomUUID());
        shipment.setVehicleId(UUID.randomUUID());
        shipment.setDriverProfileId(UUID.randomUUID());
        shipment.setStatus(ShipmentStatus.ASSIGNED);
        shipment.setUpdatedAt(java.time.Instant.now());
        MatchEntity match = new MatchEntity();
        match.setId(shipment.getMatchId());
        when(matchRepository.findForUser(userId)).thenReturn(List.of(match));
        when(repository.findByMatchIdInOrderByUpdatedAtDesc(List.of(match.getId()))).thenReturn(List.of(shipment));

        var result = service.listForUser(userId);

        org.assertj.core.api.Assertions.assertThat(result).hasSize(1);
        verify(repository).findByMatchIdInOrderByUpdatedAtDesc(List.of(match.getId()));
    }

    private ShipmentEntity shipmentAt(ShipmentStatus status) {
        ShipmentEntity shipment = new ShipmentEntity();
        shipment.setId(UUID.randomUUID());
        shipment.setShipperCompanyId(UUID.randomUUID());
        shipment.setCarrierCompanyId(UUID.randomUUID());
        shipment.setDriverProfileId(UUID.randomUUID());
        shipment.setStatus(status);
        return shipment;
    }

    private void mockTransitionActor(String actor) {
        Query query = mock(Query.class);
        when(entityManager.createNativeQuery(contains("CARRIER_MANAGER"))).thenReturn(query);
        when(query.setParameter(anyInt(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(actor);
    }
}
