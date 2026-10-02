package com.guclogistics.matching.application;

import com.guclogistics.matching.domain.ShipmentStatus;
import com.guclogistics.matching.infrastructure.persistence.ShipmentEntity;
import com.guclogistics.matching.infrastructure.persistence.ShipmentJpaRepository;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShipmentServiceTest {
    @Mock ShipmentJpaRepository repository;
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
        Query membership=mock(Query.class);Query driver=mock(Query.class);
        when(entityManager.createNativeQuery(contains("company_members"))).thenReturn(membership);
        when(entityManager.createNativeQuery(contains("driver_profiles"))).thenReturn(driver);
        when(membership.setParameter(anyInt(),any())).thenReturn(membership);
        when(driver.setParameter(anyInt(),any())).thenReturn(driver);
        when(membership.getSingleResult()).thenReturn(1L);
        when(driver.getSingleResult()).thenReturn(UUID.randomUUID());

        assertThatThrownBy(()->service.transition(shipment.getId(),userId,ShipmentStatus.DELIVERED))
                .isInstanceOf(DomainException.class).hasMessageContaining("Invalid shipment status");
    }
}
