package com.enterprise.erp.service.impl;

import com.enterprise.erp.dto.request.PurchaseOrderRequest;
import com.enterprise.erp.dto.response.PurchaseOrderItemResponse;
import com.enterprise.erp.dto.response.PurchaseOrderResponse;
import com.enterprise.erp.entity.*;
import com.enterprise.erp.entity.enums.PurchaseOrderStatus;
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
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
            .orElseThrow(() -> new ResourceNotFoundException("Supplier", request.getSupplierId()));

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
            .orElseThrow(() -> new ResourceNotFoundException("Warehouse", request.getWarehouseId()));

        PurchaseOrder order = PurchaseOrder.builder()
            .orderNumber(generateOrderNumber("PO"))
            .supplier(supplier)
            .warehouse(warehouse)
            .status(PurchaseOrderStatus.CREATED)
            .notes(request.getNotes())
            .expectedDate(request.getExpectedDate())
            .build();

        List<PurchaseOrderItem> items = request.getItems().stream().map(itemReq -> {
            Product product = productRepository.findById(itemReq.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", itemReq.getProductId()));
            return PurchaseOrderItem.builder()
                .purchaseOrder(order)
                .product(product)
                .quantity(itemReq.getQuantity())
                .receivedQuantity(0)
                .unitCost(itemReq.getUnitCost())
                .notes(itemReq.getNotes())
                .build();
        }).toList();

        order.setItems(items);
        order.calculateTotal();

        PurchaseOrder saved = purchaseOrderRepository.save(order);
        log.info("Purchase order created: {}", saved.getOrderNumber());
        return toResponse(saved);
    }

    @Transactional
    public PurchaseOrderResponse approvePurchaseOrder(Long orderId) {
        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", orderId));

        if (order.getStatus() != PurchaseOrderStatus.CREATED) {
            throw new InvalidOrderStateException("Only CREATED orders can be approved.");
        }

        order.setStatus(PurchaseOrderStatus.APPROVED);
        order.setApprovedAt(LocalDateTime.now());
        PurchaseOrder saved = purchaseOrderRepository.save(order);
        log.info("Purchase order approved: {}", order.getOrderNumber());
        return toResponse(saved);
    }

    // ================================================================
    // RECEIVE PURCHASE ORDER - adds to inventory
    // Supports partial receiving
    // ================================================================
    @Transactional
    public PurchaseOrderResponse receivePurchaseOrder(Long orderId) {
        PurchaseOrder order = purchaseOrderRepository.findByIdWithItems(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", orderId));

        if (order.getStatus() != PurchaseOrderStatus.APPROVED
                && order.getStatus() != PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw new InvalidOrderStateException(
                "Order must be APPROVED or PARTIALLY_RECEIVED to receive. Status: " + order.getStatus());
        }

        // Add all pending items to inventory
        for (PurchaseOrderItem item : order.getItems()) {
            int pending = item.getPendingQuantity();
            if (pending > 0) {
                inventoryService.addInventory(
                    item.getProduct().getId(),
                    order.getWarehouse().getId(),
                    pending,
                    order.getId()
                );
                item.setReceivedQuantity(item.getQuantity());
            }
        }

        order.setStatus(PurchaseOrderStatus.RECEIVED);
        order.setReceivedAt(LocalDateTime.now());
        PurchaseOrder saved = purchaseOrderRepository.save(order);
        log.info("Purchase order fully received: {}", order.getOrderNumber());
        return toResponse(saved);
    }

    @Transactional
    public PurchaseOrderResponse cancelPurchaseOrder(Long orderId) {
        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", orderId));

        if (order.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new InvalidOrderStateException("Cannot cancel a fully received order.");
        }

        order.setStatus(PurchaseOrderStatus.CANCELLED);
        return toResponse(purchaseOrderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getById(Long id) {
        PurchaseOrder order = purchaseOrderRepository.findByIdWithItems(id)
            .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", id));
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public Page<PurchaseOrderResponse> getAllOrders(Pageable pageable) {
        return purchaseOrderRepository.findAll(pageable).map(this::toResponse);
    }

    private String generateOrderNumber(String prefix) {
        return prefix + "-" + System.currentTimeMillis() + "-"
            + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder order) {
        List<PurchaseOrderItemResponse> itemResponses = null;
        if (order.getItems() != null) {
            itemResponses = order.getItems().stream().map(item ->
                PurchaseOrderItemResponse.builder()
                    .id(item.getId())
                    .productId(item.getProduct().getId())
                    .productSku(item.getProduct().getSku())
                    .productName(item.getProduct().getName())
                    .quantity(item.getQuantity())
                    .receivedQuantity(item.getReceivedQuantity())
                    .pendingQuantity(item.getPendingQuantity())
                    .unitCost(item.getUnitCost())
                    .totalCost(item.getTotalCost())
                    .build()
            ).toList();
        }

        return PurchaseOrderResponse.builder()
            .id(order.getId())
            .orderNumber(order.getOrderNumber())
            .supplierId(order.getSupplier().getId())
            .supplierName(order.getSupplier().getName())
            .warehouseId(order.getWarehouse().getId())
            .warehouseName(order.getWarehouse().getName())
            .status(order.getStatus())
            .totalAmount(order.getTotalAmount())
            .notes(order.getNotes())
            .expectedDate(order.getExpectedDate())
            .receivedAt(order.getReceivedAt())
            .createdAt(order.getCreatedAt())
            .items(itemResponses)
            .build();
    }
}
