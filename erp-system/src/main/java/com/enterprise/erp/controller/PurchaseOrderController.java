package com.enterprise.erp.controller;

import com.enterprise.erp.dto.request.PurchaseOrderRequest;
import com.enterprise.erp.dto.response.ApiResponse;
import com.enterprise.erp.dto.response.PurchaseOrderResponse;
import com.enterprise.erp.entity.enums.PurchaseOrderStatus;
import com.enterprise.erp.service.impl.PurchaseOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
@Tag(name = "Purchase Orders", description = "Procurement Order Management")
@SecurityRequirement(name = "Bearer Authentication")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Create a new purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> createOrder(
            @Valid @RequestBody PurchaseOrderRequest request) {
        PurchaseOrderResponse order = purchaseOrderService.createPurchaseOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Purchase order created", order));
    }

    @GetMapping
    @Operation(summary = "Get all purchase orders")
    public ResponseEntity<ApiResponse<Page<PurchaseOrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            purchaseOrderService.getAllOrders(
                PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase order by ID with items")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(purchaseOrderService.getById(id)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Approve a purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> approveOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Purchase order approved",
            purchaseOrderService.approvePurchaseOrder(id)));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Receive purchase order - adds items to inventory")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> receiveOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Inventory updated from purchase order",
            purchaseOrderService.receivePurchaseOrder(id)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Cancel a purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Purchase order cancelled",
            purchaseOrderService.cancelPurchaseOrder(id)));
    }
}
