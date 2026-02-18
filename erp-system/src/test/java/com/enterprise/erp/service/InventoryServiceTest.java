package com.enterprise.erp.service;

import com.enterprise.erp.dto.request.InventoryAdjustRequest;
import com.enterprise.erp.dto.response.InventoryResponse;
import com.enterprise.erp.entity.*;
import com.enterprise.erp.entity.enums.ProductStatus;
import com.enterprise.erp.exception.BusinessValidationException;
import com.enterprise.erp.exception.InsufficientStockException;
import com.enterprise.erp.exception.ResourceNotFoundException;
import com.enterprise.erp.repository.*;
import com.enterprise.erp.service.impl.InventoryService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryService Unit Tests")
class InventoryServiceTest {

    @Mock private InventoryRepository inventoryRepository;
    @Mock private InventoryMovementRepository movementRepository;
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseRepository warehouseRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private Product testProduct;
    private Warehouse testWarehouse;
    private Inventory testInventory;

    @BeforeEach
    void setUp() {
        testProduct = Product.builder()
            .id(1L)
            .sku("SKU-TEST-001")
            .name("Test Product")
            .unitPrice(new BigDecimal("99.99"))
            .costPrice(new BigDecimal("50.00"))
            .reorderLevel(10)
            .reorderQuantity(50)
            .status(ProductStatus.ACTIVE)
            .version(0L)
            .build();

        testWarehouse = Warehouse.builder()
            .id(1L)
            .name("Main Warehouse")
            .code("WH-001")
            .build();

        testInventory = Inventory.builder()
            .id(1L)
            .product(testProduct)
            .warehouse(testWarehouse)
            .quantity(100)
            .reservedQuantity(20)
            .version(0L)
            .build();
    }

    // ================================================================
    // RESERVE INVENTORY TESTS
    // ================================================================

    @Test
    @DisplayName("Should reserve inventory when sufficient stock available")
    void reserveInventory_ShouldSucceed_WhenStockAvailable() {
        when(inventoryRepository.findByProductAndWarehouseForUpdate(1L, 1L))
            .thenReturn(Optional.of(testInventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(testInventory);
        when(movementRepository.save(any())).thenReturn(null);

        assertThatNoException().isThrownBy(
            () -> inventoryService.reserveInventory(1L, 1L, 30)
        );

        // Verify reservation increased
        assertThat(testInventory.getReservedQuantity()).isEqualTo(50); // 20 + 30
        verify(inventoryRepository).save(testInventory);
    }

    @Test
    @DisplayName("Should throw InsufficientStockException when not enough available quantity")
    void reserveInventory_ShouldThrow_WhenInsufficientStock() {
        // Available = 100 - 20 = 80, but requesting 90
        when(inventoryRepository.findByProductAndWarehouseForUpdate(1L, 1L))
            .thenReturn(Optional.of(testInventory));

        assertThatThrownBy(() -> inventoryService.reserveInventory(1L, 1L, 90))
            .isInstanceOf(InsufficientStockException.class)
            .hasMessageContaining("SKU-TEST-001");

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when inventory record not found")
    void reserveInventory_ShouldThrow_WhenInventoryNotFound() {
        when(inventoryRepository.findByProductAndWarehouseForUpdate(99L, 99L))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.reserveInventory(99L, 99L, 10))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    // ================================================================
    // DEDUCT INVENTORY TESTS
    // ================================================================

    @Test
    @DisplayName("Should deduct inventory on shipment")
    void deductInventory_ShouldSucceed_WhenStockSufficient() {
        when(inventoryRepository.findByProductAndWarehouseForUpdate(1L, 1L))
            .thenReturn(Optional.of(testInventory));
        when(inventoryRepository.save(any())).thenReturn(testInventory);
        when(movementRepository.save(any())).thenReturn(null);

        inventoryService.deductInventory(1L, 1L, 30, 100L);

        assertThat(testInventory.getQuantity()).isEqualTo(70); // 100 - 30
        verify(inventoryRepository).save(testInventory);
        verify(movementRepository).save(any());
    }

    @Test
    @DisplayName("Should prevent deducting more than available total quantity")
    void deductInventory_ShouldThrow_WhenExceedsTotalQty() {
        when(inventoryRepository.findByProductAndWarehouseForUpdate(1L, 1L))
            .thenReturn(Optional.of(testInventory));

        assertThatThrownBy(() -> inventoryService.deductInventory(1L, 1L, 150, 100L))
            .isInstanceOf(InsufficientStockException.class);
    }

    // ================================================================
    // MANUAL ADJUSTMENT TESTS
    // ================================================================

    @Test
    @DisplayName("Should adjust inventory positively")
    void adjustInventory_ShouldSucceed_WhenPositiveDelta() {
        InventoryAdjustRequest request = InventoryAdjustRequest.builder()
            .productId(1L).warehouseId(1L).quantity(50).notes("Recount correction")
            .build();

        when(inventoryRepository.findByProductAndWarehouseForUpdate(1L, 1L))
            .thenReturn(Optional.of(testInventory));
        when(inventoryRepository.save(any())).thenReturn(testInventory);
        when(movementRepository.save(any())).thenReturn(null);

        InventoryResponse response = inventoryService.adjustInventory(request);

        assertThat(testInventory.getQuantity()).isEqualTo(150); // 100 + 50
        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("Should throw BusinessValidationException when adjustment causes negative stock")
    void adjustInventory_ShouldThrow_WhenNegativeResult() {
        InventoryAdjustRequest request = InventoryAdjustRequest.builder()
            .productId(1L).warehouseId(1L).quantity(-200).notes("Wrong adjustment")
            .build();

        when(inventoryRepository.findByProductAndWarehouseForUpdate(1L, 1L))
            .thenReturn(Optional.of(testInventory));

        assertThatThrownBy(() -> inventoryService.adjustInventory(request))
            .isInstanceOf(BusinessValidationException.class)
            .hasMessageContaining("negative inventory");
    }

    // ================================================================
    // ADD INVENTORY TESTS (from Purchase Order)
    // ================================================================

    @Test
    @DisplayName("Should add inventory when purchase order is received")
    void addInventory_ShouldIncreaseQuantity() {
        when(inventoryRepository.findByProductIdAndWarehouseId(1L, 1L))
            .thenReturn(Optional.of(testInventory));
        when(inventoryRepository.save(any())).thenReturn(testInventory);
        when(movementRepository.save(any())).thenReturn(null);

        inventoryService.addInventory(1L, 1L, 200, 50L);

        assertThat(testInventory.getQuantity()).isEqualTo(300); // 100 + 200
        verify(movementRepository).save(any()); // Audit trail recorded
    }
}
