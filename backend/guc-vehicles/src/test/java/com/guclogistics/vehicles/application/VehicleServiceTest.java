package com.guclogistics.vehicles.application;

import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.vehicles.application.dto.CreateVehicleRequest;
import com.guclogistics.vehicles.application.dto.UpdateVehicleRequest;
import com.guclogistics.vehicles.domain.OwnerType;
import com.guclogistics.vehicles.domain.VehicleStatus;
import com.guclogistics.vehicles.infrastructure.persistence.VehicleEntity;
import com.guclogistics.vehicles.infrastructure.persistence.VehicleJpaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleJpaRepository repository;
    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private VehicleService vehicleService;

    @Test
    void createPersistsVehicle() {
        UUID userId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        CreateVehicleRequest request = new CreateVehicleRequest(
                OwnerType.COMPANY, ownerId, "34ABC123", "VIN123", "TRUCK",
                BigDecimal.valueOf(10000), BigDecimal.valueOf(50));

        when(repository.save(any(VehicleEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        Query query = org.mockito.Mockito.mock(Query.class);
        when(entityManager.createNativeQuery(any())).thenReturn(query);
        when(query.setParameter(org.mockito.ArgumentMatchers.anyInt(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(1L);

        var response = vehicleService.create(userId, request);

        assertThat(response.plate()).isEqualTo("34ABC123");
        assertThat(response.status()).isEqualTo(VehicleStatus.ACTIVE);
        assertThat(response.createdByUserId()).isEqualTo(userId);
    }

    @Test
    void listMineReturnsOwnedVehicles() {
        UUID userId = UUID.randomUUID();
        VehicleEntity vehicle = vehicle(userId);
        when(repository.findAccessible(userId)).thenReturn(List.of(vehicle));

        assertThat(vehicleService.listMine(userId)).hasSize(1);
    }

    @Test
    void getByIdReturnsOwnedVehicle() {
        UUID vehicleId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        VehicleEntity vehicle = vehicle(userId);
        vehicle.setId(vehicleId);

        when(repository.findAccessibleById(vehicleId, userId)).thenReturn(Optional.of(vehicle));

        assertThat(vehicleService.getById(vehicleId, userId).plate()).isEqualTo("34ABC123");
    }

    @Test
    void requireOwnedThrowsForOtherUser() {
        UUID vehicleId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();

        when(repository.findAccessibleById(vehicleId, otherUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vehicleService.getById(vehicleId, otherUserId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("access denied");

        assertThatThrownBy(() -> vehicleService.update(vehicleId, otherUserId, null))
                .isInstanceOf(DomainException.class);

        assertThatThrownBy(() -> vehicleService.delete(vehicleId, otherUserId))
                .isInstanceOf(DomainException.class);
    }

    @Test
    void updateAppliesChanges() {
        UUID vehicleId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        VehicleEntity vehicle = vehicle(userId);
        vehicle.setId(vehicleId);

        when(repository.findAccessibleById(vehicleId, userId)).thenReturn(Optional.of(vehicle));
        when(repository.save(vehicle)).thenReturn(vehicle);

        var response = vehicleService.update(vehicleId, userId,
                new UpdateVehicleRequest("99XYZ999", null, "VAN", null, null, VehicleStatus.INACTIVE));

        assertThat(response.plate()).isEqualTo("99XYZ999");
        assertThat(response.type()).isEqualTo("VAN");
        assertThat(response.status()).isEqualTo(VehicleStatus.INACTIVE);
    }

    @Test
    void deleteRemovesOwnedVehicle() {
        UUID vehicleId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        VehicleEntity vehicle = vehicle(userId);

        when(repository.findAccessibleById(vehicleId, userId)).thenReturn(Optional.of(vehicle));

        vehicleService.delete(vehicleId, userId);

        verify(repository).delete(vehicle);
    }

    private static VehicleEntity vehicle(UUID userId) {
        VehicleEntity vehicle = new VehicleEntity();
        vehicle.setOwnerType(OwnerType.COMPANY);
        vehicle.setOwnerId(UUID.randomUUID());
        vehicle.setPlate("34ABC123");
        vehicle.setType("TRUCK");
        vehicle.setStatus(VehicleStatus.ACTIVE);
        vehicle.setCreatedByUserId(userId);
        return vehicle;
    }
}
