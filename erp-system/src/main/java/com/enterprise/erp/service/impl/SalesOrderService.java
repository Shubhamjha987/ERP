package com.enterprise.erp.service.impl;

import com.enterprise.erp.dto.request.SalesOrderRequest;
import com.enterprise.erp.dto.response.SalesOrderItemResponse;
import com.enterprise.erp.dto.response.SalesOrderResponse;
import com.enterprise.erp.entity.*;
import com.enterprise.erp.entity.enums.SalesOrderStatus;
import com.enterprise.erp.exception.InvalidOrderStateException;
import com.enterprise.erp.exception.ResourceNotFoundException;
import com.enterprise.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    // ================================================================
    // CREATE SALES ORDER
    // Validates stock availability WITHOUT reserving (optimistic phase)
    // ================================================================
    @Transactional
    public SalesOrderResponse createSalesOrder(SalesOrderRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
            .orElseThrow(() -> new ResourceNotFoundException("Customer", request.getCustomerId()));

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
            .orElseThrow(() -> new ResourceNotFoundException("Warehouse", request.getWarehouseId()));

        SalesOrder order = SalesOrder.builder()
            .orderNumber(generateOrderNumber("SO"))
            .customer(customer)
            .warehouse(warehouse)
            .status(SalesOrderStatus.CREATED)
            .notes(request.getNotes())
            .requestedDate(request.getRequestedDate())
            .build();

        List<SalesOrderItem> items = request.getItems().stream().map(itemReq -> {
            Product product = productRepository.findById(itemReq.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", itemReq.getProductId()));
            return SalesOrderItem.builder()
                .salesOrder(order)
                .product(product)
                .quantity(itemReq.getQuantity())
                .unitPrice(itemReq.getUnitPrice())
                .notes(itemReq.getNotes())
                .build();
        }).toList();

        order.setItems(items);
        order.calculateTotal();

        SalesOrder saved = salesOrderRepository.save(order);
        log.info("Sales order created: {}", saved.getOrderNumber());
        return toResponse(saved);
    }

    // ================================================================
    // CONFIRM ORDER - RESERVE INVENTORY
    // This is where pessimistic locks fire per item
    // ================================================================
    @Transactional
    public SalesOrderResponse confirmOrder(Long orderId) {
        SalesOrder order = salesOrderRepository.findByIdWithItems(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", orderId));

        if (order.getStatus() != SalesOrderStatus.CREATED) {
            throw new InvalidOrderStateException(
                "Order " + order.getOrderNumber() + " cannot be confirmed. Status: " + order.getStatus());
        }

        // Reserve inventory for each item (with pessimistic lock per product)
        for (SalesOrderItem item : order.getItems()) {
            inventoryService.reserveInventory(
                item.getProduct().getId(),
                order.getWarehouse().getId(),
                item.getQuantity()
            );
        }

        order.setStatus(SalesOrderStatus.CONFIRMED);
        SalesOrder saved = salesOrderRepository.save(order);
        log.info("Sales order confirmed and inventory reserved: {}", order.getOrderNumber());
        return toResponse(saved);
    }

    // ================================================================
    // SHIP ORDER - DEDUCT INVENTORY
    // ================================================================
    @Transactional
    public SalesOrderResponse shipOrder(Long orderId) {
        SalesOrder order = salesOrderRepository.findByIdWithItems(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", orderId));

        if (order.getStatus() != SalesOrderStatus.CONFIRMED
                && order.getStatus() != SalesOrderStatus.PICKING) {
            throw new InvalidOrderStateException(
                "Order " + order.getOrderNumber() + " cannot be shipped. Status: " + order.getStatus());
        }

        // Deduct physical inventory
        for (SalesOrderItem item : order.getItems()) {
            inventoryService.deductInventory(
                item.getProduct().getId(),
                order.getWarehouse().getId(),
                item.getQuantity(),
                order.getId()
            );
        }

        order.setStatus(SalesOrderStatus.SHIPPED);
        order.setShippedAt(LocalDateTime.now());
        SalesOrder saved = salesOrderRepository.save(order);
        log.info("Sales order shipped: {}", order.getOrderNumber());
        return toResponse(saved);
    }

    // ================================================================
    // DELIVER ORDER
    // ================================================================
    @Transactional
    public SalesOrderResponse deliverOrder(Long orderId) {
        SalesOrder order = salesOrderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", orderId));

        if (order.getStatus() != SalesOrderStatus.SHIPPED) {
            throw new InvalidOrderStateException("Order must be SHIPPED before marking DELIVERED");
        }

        order.setStatus(SalesOrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());
        return toResponse(salesOrderRepository.save(order));
    }

    // ================================================================
    // CANCEL ORDER - RELEASE RESERVATION
    // ================================================================
    @Transactional
    public SalesOrderResponse cancelOrder(Long orderId) {
        SalesOrder order = salesOrderRepository.findByIdWithItems(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", orderId));

        if (order.getStatus() == SalesOrderStatus.SHIPPED
                || order.getStatus() == SalesOrderStatus.DELIVERED) {
            throw new InvalidOrderStateException("Cannot cancel an order that has already been shipped.");
        }

        // Release reserved inventory if it was confirmed
        if (order.getStatus() == SalesOrderStatus.CONFIRMED
                || order.getStatus() == SalesOrderStatus.PICKING) {
            for (SalesOrderItem item : order.getItems()) {
                inventoryService.releaseReservation(
                    item.getProduct().getId(),
                    order.getWarehouse().getId(),
                    item.getQuantity()
                );
            }
        }

        order.setStatus(SalesOrderStatus.CANCELLED);
        SalesOrder saved = salesOrderRepository.save(order);
        log.info("Sales order cancelled and reservations released: {}", order.getOrderNumber());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SalesOrderResponse getById(Long id) {
        SalesOrder order = salesOrderRepository.findByIdWithItems(id)
            .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", id));
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public Page<SalesOrderResponse> getAllOrders(Pageable pageable) {
        return salesOrderRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<SalesOrderResponse> getOrdersByStatus(SalesOrderStatus status, Pageable pageable) {
        return salesOrderRepository.findByStatus(status, pageable).map(this::toResponse);
    }

    // ================================================================
    // HELPERS
    // ================================================================
    private String generateOrderNumber(String prefix) {
        return prefix + "-" + System.currentTimeMillis() + "-"
            + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private SalesOrderResponse toResponse(SalesOrder order) {
        List<SalesOrderItemResponse> itemResponses = null;
        if (order.getItems() != null) {
            itemResponses = order.getItems().stream().map(item ->
                SalesOrderItemResponse.builder()
                    .id(item.getId())
                    .productId(item.getProduct().getId())
                    .productSku(item.getProduct().getSku())
                    .productName(item.getProduct().getName())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .totalPrice(item.getTotalPrice())
                    .build()
            ).toList();
        }

        return SalesOrderResponse.builder()
            .id(order.getId())
            .orderNumber(order.getOrderNumber())
            .customerId(order.getCustomer().getId())
            .customerName(order.getCustomer().getName())
            .warehouseId(order.getWarehouse().getId())
            .warehouseName(order.getWarehouse().getName())
            .status(order.getStatus())
            .totalAmount(order.getTotalAmount())
            .notes(order.getNotes())
            .requestedDate(order.getRequestedDate())
            .shippedAt(order.getShippedAt())
            .deliveredAt(order.getDeliveredAt())
            .createdAt(order.getCreatedAt())
            .items(itemResponses)
            .build();
    }
}
