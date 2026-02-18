package com.enterprise.erp.service.impl;

import com.enterprise.erp.dto.request.InventoryAdjustRequest;
import com.enterprise.erp.dto.response.InventoryResponse;
import com.enterprise.erp.entity.Inventory;
import com.enterprise.erp.entity.InventoryMovement;
import com.enterprise.erp.entity.Product;
import com.enterprise.erp.entity.Warehouse;
import com.enterprise.erp.entity.enums.MovementType;
import com.enterprise.erp.entity.enums.ReferenceType;
import com.enterprise.erp.exception.BusinessValidationException;
import com.enterprise.erp.exception.InsufficientStockException;
import com.enterprise.erp.exception.ResourceNotFoundException;
import com.enterprise.erp.repository.InventoryMovementRepository;
import com.enterprise.erp.repository.InventoryRepository;
import com.enterprise.erp.repository.ProductRepository;
import com.enterprise.erp.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    // ================================================================
    // RESERVE INVENTORY (called when Sales Order is CONFIRMED)
    // Uses PESSIMISTIC_WRITE lock to prevent concurrent overselling
    // ================================================================
    @Transactional
    public void reserveInventory(Long productId, Long warehouseId, int quantity) {
        // PESSIMISTIC LOCK - SELECT ... FOR UPDATE in PostgreSQL
        Inventory inventory = inventoryRepository
            .findByProductAndWarehouseForUpdate(productId, warehouseId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No inventory found for product: " + productId + " in warehouse: " + warehouseId));

        int available = inventory.getAvailableQuantity();
        if (available < quantity) {
            throw new InsufficientStockException(
                inventory.getProduct().getSku(), quantity, available);
        }

        int beforeQty = inventory.getQuantity();
        inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);
        inventoryRepository.save(inventory);

        log.info("Reserved {} units of product {} in warehouse {}",
            quantity, inventory.getProduct().getSku(), warehouseId);

        recordMovement(inventory.getProduct(), inventory.getWarehouse(),
            MovementType.SALE, -quantity, beforeQty,
            inventory.getQuantity(), ReferenceType.SALES_ORDER, null, "Inventory reserved for order");
    }

    // ================================================================
    // RELEASE RESERVATION (called when order is CANCELLED)
    // ================================================================
    @Transactional
    public void releaseReservation(Long productId, Long warehouseId, int quantity) {
        Inventory inventory = inventoryRepository
            .findByProductAndWarehouseForUpdate(productId, warehouseId)
            .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

        int newReserved = Math.max(0, inventory.getReservedQuantity() - quantity);
        inventory.setReservedQuantity(newReserved);
        inventoryRepository.save(inventory);

        log.info("Released reservation of {} units for product {} in warehouse {}",
            quantity, inventory.getProduct().getSku(), warehouseId);
    }

    // ================================================================
    // DEDUCT INVENTORY (called when Sales Order is SHIPPED)
    // ================================================================
    @Transactional
    public void deductInventory(Long productId, Long warehouseId, int quantity, Long salesOrderId) {
        Inventory inventory = inventoryRepository
            .findByProductAndWarehouseForUpdate(productId, warehouseId)
            .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

        if (inventory.getQuantity() < quantity) {
            throw new InsufficientStockException(
                inventory.getProduct().getSku(), quantity, inventory.getQuantity());
        }

        int beforeQty = inventory.getQuantity();
        inventory.setQuantity(inventory.getQuantity() - quantity);
        inventory.setReservedQuantity(
            Math.max(0, inventory.getReservedQuantity() - quantity));
        inventoryRepository.save(inventory);

        log.info("Deducted {} units of product {} for sales order {}",
            quantity, inventory.getProduct().getSku(), salesOrderId);

        recordMovement(inventory.getProduct(), inventory.getWarehouse(),
            MovementType.SALE, -quantity, beforeQty, inventory.getQuantity(),
            ReferenceType.SALES_ORDER, salesOrderId, "Shipped");
    }

    // ================================================================
    // ADD INVENTORY (called when Purchase Order is RECEIVED)
    // ================================================================
    @Transactional
    public void addInventory(Long productId, Long warehouseId, int quantity, Long purchaseOrderId) {
        Inventory inventory = findOrCreateInventory(productId, warehouseId);

        int beforeQty = inventory.getQuantity();
        inventory.setQuantity(inventory.getQuantity() + quantity);
        inventoryRepository.save(inventory);

        log.info("Added {} units of product {} from purchase order {}",
            quantity, inventory.getProduct().getSku(), purchaseOrderId);

        recordMovement(inventory.getProduct(), inventory.getWarehouse(),
            MovementType.PURCHASE, quantity, beforeQty, inventory.getQuantity(),
            ReferenceType.PURCHASE_ORDER, purchaseOrderId, "Received from supplier");
    }

    // ================================================================
    // MANUAL ADJUSTMENT (admin/manager only)
    // ================================================================
    @Transactional
    public InventoryResponse adjustInventory(InventoryAdjustRequest request) {
        Inventory inventory = inventoryRepository
            .findByProductAndWarehouseForUpdate(request.getProductId(), request.getWarehouseId())
            .orElseGet(() -> {
                Product product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", request.getProductId()));
                Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse", request.getWarehouseId()));
                return Inventory.builder()
                    .product(product)
                    .warehouse(warehouse)
                    .quantity(0)
                    .reservedQuantity(0)
                    .build();
            });

        int delta = request.getQuantity();
        int newQty = inventory.getQuantity() + delta;

        if (newQty < 0) {
            throw new BusinessValidationException(
                "Adjustment would result in negative inventory. Current: "
                + inventory.getQuantity() + ", Delta: " + delta);
        }

        int beforeQty = inventory.getQuantity();
        inventory.setQuantity(newQty);

        // If decreasing, ensure reserved doesn't exceed new quantity
        if (newQty < inventory.getReservedQuantity()) {
            inventory.setReservedQuantity(newQty);
        }

        Inventory saved = inventoryRepository.save(inventory);

        recordMovement(saved.getProduct(), saved.getWarehouse(),
            MovementType.ADJUSTMENT, delta, beforeQty, newQty,
            ReferenceType.MANUAL, null, request.getNotes());

        log.info("Manual adjustment: {} units, product {}, warehouse {}",
            delta, request.getProductId(), request.getWarehouseId());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<InventoryResponse> getAllInventory(Pageable pageable) {
        return inventoryRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> getLowStockItems() {
        return inventoryRepository.findLowStockItems().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> getOutOfStockItems() {
        return inventoryRepository.findOutOfStockItems().stream().map(this::toResponse).toList();
    }

    // ================================================================
    // HELPERS
    // ================================================================
    private Inventory findOrCreateInventory(Long productId, Long warehouseId) {
        return inventoryRepository.findByProductIdAndWarehouseId(productId, warehouseId)
            .orElseGet(() -> {
                Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
                Warehouse warehouse = warehouseRepository.findById(warehouseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse", warehouseId));
                return inventoryRepository.save(
                    Inventory.builder()
                        .product(product)
                        .warehouse(warehouse)
                        .quantity(0)
                        .reservedQuantity(0)
                        .build()
                );
            });
    }

    private void recordMovement(Product product, Warehouse warehouse,
                                MovementType type, int delta,
                                int before, int after,
                                ReferenceType refType, Long refId, String notes) {
        String currentUser = "SYSTEM";
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                currentUser = auth.getName();
            }
        } catch (Exception ignored) {}

        InventoryMovement movement = InventoryMovement.builder()
            .product(product)
            .warehouse(warehouse)
            .movementType(type)
            .quantity(delta)
            .quantityBefore(before)
            .quantityAfter(after)
            .referenceType(refType)
            .referenceId(refId)
            .notes(notes)
            .createdBy(currentUser)
            .build();

        movementRepository.save(movement);
    }

    private InventoryResponse toResponse(Inventory inv) {
        String stockStatus;
        if (inv.getQuantity() == 0) {
            stockStatus = "OUT_OF_STOCK";
        } else if (inv.getQuantity() <= inv.getProduct().getReorderLevel()) {
            stockStatus = "LOW_STOCK";
        } else {
            stockStatus = "IN_STOCK";
        }

        BigDecimal stockValue = inv.getProduct().getCostPrice()
            .multiply(BigDecimal.valueOf(inv.getQuantity()));

        return InventoryResponse.builder()
            .id(inv.getId())
            .productId(inv.getProduct().getId())
            .productSku(inv.getProduct().getSku())
            .productName(inv.getProduct().getName())
            .warehouseId(inv.getWarehouse().getId())
            .warehouseName(inv.getWarehouse().getName())
            .quantity(inv.getQuantity())
            .reservedQuantity(inv.getReservedQuantity())
            .availableQuantity(inv.getAvailableQuantity())
            .stockValue(stockValue)
            .stockStatus(stockStatus)
            .lastUpdated(inv.getLastUpdated())
            .build();
    }
}
