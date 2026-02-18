package com.enterprise.erp.controller;

import com.enterprise.erp.dto.request.InventoryAdjustRequest;
import com.enterprise.erp.dto.response.ApiResponse;
import com.enterprise.erp.dto.response.InventoryMovementResponse;
import com.enterprise.erp.dto.response.InventoryResponse;
import com.enterprise.erp.entity.InventoryMovement;
import com.enterprise.erp.repository.InventoryMovementRepository;
import com.enterprise.erp.service.impl.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Inventory Management")
@SecurityRequirement(name = "Bearer Authentication")
public class InventoryController {

    private final InventoryService inventoryService;
    private final InventoryMovementRepository movementRepository;

    @GetMapping
    @Operation(summary = "Get all inventory with pagination")
    public ResponseEntity<ApiResponse<Page<InventoryResponse>>> getAllInventory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            inventoryService.getAllInventory(PageRequest.of(page, size))));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get all low stock items (quantity <= reorder level)")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getLowStock() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLowStockItems()));
    }

    @GetMapping("/out-of-stock")
    @Operation(summary = "Get all out-of-stock items")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getOutOfStock() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getOutOfStockItems()));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Manual inventory adjustment (+/-)")
    public ResponseEntity<ApiResponse<InventoryResponse>> adjustInventory(
            @Valid @RequestBody InventoryAdjustRequest request) {
        InventoryResponse result = inventoryService.adjustInventory(request);
        return ResponseEntity.ok(ApiResponse.success("Inventory adjusted successfully", result));
    }

    @GetMapping("/movements")
    @Operation(summary = "Get inventory movement audit trail")
    public ResponseEntity<ApiResponse<Page<InventoryMovementResponse>>> getMovements(
            @RequestParam(required = false) Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<InventoryMovement> movements = productId != null
            ? movementRepository.findByProductId(productId, pageable)
            : movementRepository.findAll(pageable);
        Page<InventoryMovementResponse> responses = movements.map(this::toMovementResponse);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    private InventoryMovementResponse toMovementResponse(InventoryMovement m) {
        return InventoryMovementResponse.builder()
            .id(m.getId())
            .productId(m.getProduct().getId())
            .productSku(m.getProduct().getSku())
            .productName(m.getProduct().getName())
            .warehouseId(m.getWarehouse().getId())
            .warehouseName(m.getWarehouse().getName())
            .movementType(m.getMovementType())
            .quantity(m.getQuantity())
            .quantityBefore(m.getQuantityBefore())
            .quantityAfter(m.getQuantityAfter())
            .referenceType(m.getReferenceType())
            .referenceId(m.getReferenceId())
            .notes(m.getNotes())
            .createdAt(m.getCreatedAt())
            .createdBy(m.getCreatedBy())
            .build();
    }
}
