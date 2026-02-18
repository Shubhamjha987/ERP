package com.enterprise.erp.controller;

import com.enterprise.erp.dto.request.SalesOrderRequest;
import com.enterprise.erp.dto.response.ApiResponse;
import com.enterprise.erp.dto.response.SalesOrderResponse;
import com.enterprise.erp.entity.enums.SalesOrderStatus;
import com.enterprise.erp.service.impl.SalesOrderService;
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
@RequestMapping("/api/sales-orders")
@RequiredArgsConstructor
@Tag(name = "Sales Orders", description = "Sales Order lifecycle management")
@SecurityRequirement(name = "Bearer Authentication")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @PostMapping
    @Operation(summary = "Create a new sales order")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> createOrder(
            @Valid @RequestBody SalesOrderRequest request) {
        SalesOrderResponse order = salesOrderService.createSalesOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Sales order created", order));
    }

    @GetMapping
    @Operation(summary = "Get all sales orders with pagination")
    public ResponseEntity<ApiResponse<Page<SalesOrderResponse>>> getAllOrders(
            @RequestParam(required = false) SalesOrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<SalesOrderResponse> orders = status != null
            ? salesOrderService.getOrdersByStatus(status, pageable)
            : salesOrderService.getAllOrders(pageable);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sales order by ID (with items)")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(salesOrderService.getById(id)));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Confirm order and reserve inventory (triggers pessimistic lock)")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> confirmOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Order confirmed and inventory reserved",
            salesOrderService.confirmOrder(id)));
    }

    @PostMapping("/{id}/ship")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Ship order and deduct inventory")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> shipOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Order shipped and inventory deducted",
            salesOrderService.shipOrder(id)));
    }

    @PostMapping("/{id}/deliver")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Mark order as delivered")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> deliverOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Order marked as delivered",
            salesOrderService.deliverOrder(id)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Cancel order and release inventory reservation")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Order cancelled and reservation released",
            salesOrderService.cancelOrder(id)));
    }
}
