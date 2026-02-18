package com.enterprise.erp.service;

import com.enterprise.erp.dto.request.SalesOrderItemRequest;
import com.enterprise.erp.dto.request.SalesOrderRequest;
import com.enterprise.erp.dto.response.SalesOrderResponse;
import com.enterprise.erp.entity.*;
import com.enterprise.erp.entity.enums.SalesOrderStatus;
import com.enterprise.erp.exception.InvalidOrderStateException;
import com.enterprise.erp.exception.ResourceNotFoundException;
import com.enterprise.erp.repository.*;
import com.enterprise.erp.service.impl.InventoryService;
import com.enterprise.erp.service.impl.SalesOrderService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SalesOrderService Unit Tests")
class SalesOrderServiceTest {

    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private ProductRepository productRepository;
    @Mock private InventoryService inventoryService;

    @InjectMocks
    private SalesOrderService salesOrderService;

    private Customer testCustomer;
    private Warehouse testWarehouse;
    private Product testProduct;
    private SalesOrder testOrder;

    @BeforeEach
    void setUp() {
        testCustomer = Customer.builder().id(1L).name("Test Customer").build();
        testWarehouse = Warehouse.builder().id(1L).name("Main WH").code("WH-001").build();
        testProduct = Product.builder()
            .id(1L).sku("SKU-001").name("Product A")
            .unitPrice(new BigDecimal("100.00"))
            .costPrice(new BigDecimal("60.00"))
            .build();

        SalesOrderItem item = SalesOrderItem.builder()
            .id(1L).product(testProduct).quantity(5)
            .unitPrice(new BigDecimal("100.00")).build();

        testOrder = SalesOrder.builder()
            .id(1L).orderNumber("SO-123")
            .customer(testCustomer).warehouse(testWarehouse)
            .status(SalesOrderStatus.CREATED)
            .totalAmount(new BigDecimal("500.00"))
            .items(new ArrayList<>(List.of(item)))
            .build();
        item.setSalesOrder(testOrder);
    }

    @Test
    @DisplayName("Should create sales order successfully")
    void createSalesOrder_ShouldReturnResponse() {
        SalesOrderRequest request = SalesOrderRequest.builder()
            .customerId(1L).warehouseId(1L)
            .items(List.of(
                SalesOrderItemRequest.builder()
                    .productId(1L).quantity(5).unitPrice(new BigDecimal("100.00"))
                    .build()
            ))
            .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(testWarehouse));
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(salesOrderRepository.save(any(SalesOrder.class))).thenReturn(testOrder);

        SalesOrderResponse response = salesOrderService.createSalesOrder(request);

        assertThat(response).isNotNull();
        assertThat(response.getCustomerName()).isEqualTo("Test Customer");
        verify(salesOrderRepository).save(any());
    }

    @Test
    @DisplayName("Should throw when customer not found during order creation")
    void createSalesOrder_ShouldThrow_WhenCustomerNotFound() {
        SalesOrderRequest request = SalesOrderRequest.builder()
            .customerId(99L).warehouseId(1L).items(List.of())
            .build();

        when(customerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> salesOrderService.createSalesOrder(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Customer");
    }

    @Test
    @DisplayName("Should confirm order and call reserveInventory for each item")
    void confirmOrder_ShouldReserveInventory_ForAllItems() {
        when(salesOrderRepository.findByIdWithItems(1L)).thenReturn(Optional.of(testOrder));
        when(salesOrderRepository.save(any())).thenReturn(testOrder);

        SalesOrderResponse response = salesOrderService.confirmOrder(1L);

        verify(inventoryService).reserveInventory(1L, 1L, 5);
        assertThat(response.getStatus()).isEqualTo(SalesOrderStatus.CONFIRMED);
    }

    @Test
    @DisplayName("Should throw when confirming already confirmed order")
    void confirmOrder_ShouldThrow_WhenAlreadyConfirmed() {
        testOrder.setStatus(SalesOrderStatus.CONFIRMED);
        when(salesOrderRepository.findByIdWithItems(1L)).thenReturn(Optional.of(testOrder));

        assertThatThrownBy(() -> salesOrderService.confirmOrder(1L))
            .isInstanceOf(InvalidOrderStateException.class);
    }

    @Test
    @DisplayName("Should ship order and deduct inventory")
    void shipOrder_ShouldDeductInventory() {
        testOrder.setStatus(SalesOrderStatus.CONFIRMED);
        when(salesOrderRepository.findByIdWithItems(1L)).thenReturn(Optional.of(testOrder));
        when(salesOrderRepository.save(any())).thenReturn(testOrder);

        SalesOrderResponse response = salesOrderService.shipOrder(1L);

        verify(inventoryService).deductInventory(1L, 1L, 5, 1L);
        assertThat(response.getStatus()).isEqualTo(SalesOrderStatus.SHIPPED);
    }

    @Test
    @DisplayName("Should cancel order and release inventory reservation")
    void cancelOrder_ShouldReleaseReservation_WhenConfirmed() {
        testOrder.setStatus(SalesOrderStatus.CONFIRMED);
        when(salesOrderRepository.findByIdWithItems(1L)).thenReturn(Optional.of(testOrder));
        when(salesOrderRepository.save(any())).thenReturn(testOrder);

        SalesOrderResponse response = salesOrderService.cancelOrder(1L);

        verify(inventoryService).releaseReservation(1L, 1L, 5);
        assertThat(response.getStatus()).isEqualTo(SalesOrderStatus.CANCELLED);
    }

    @Test
    @DisplayName("Should prevent cancelling an already-shipped order")
    void cancelOrder_ShouldThrow_WhenOrderAlreadyShipped() {
        testOrder.setStatus(SalesOrderStatus.SHIPPED);
        when(salesOrderRepository.findByIdWithItems(1L)).thenReturn(Optional.of(testOrder));

        assertThatThrownBy(() -> salesOrderService.cancelOrder(1L))
            .isInstanceOf(InvalidOrderStateException.class)
            .hasMessageContaining("shipped");
    }
}
