package com.enterprise.erp.controller;

import com.enterprise.erp.analytics.AnalyticsService;
import com.enterprise.erp.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard Analytics", description = "ERP Analytics & Reporting")
@SecurityRequirement(name = "Bearer Authentication")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class DashboardController {

    private final AnalyticsService analyticsService;

    @GetMapping("/inventory")
    @Operation(summary = "Inventory dashboard - stock levels, low stock, out of stock, fast movers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInventoryDashboard() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getInventoryDashboard()));
    }

    @GetMapping("/orders")
    @Operation(summary = "Order dashboard - daily/weekly/monthly stats, status distribution, top products")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrderDashboard() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getOrderDashboard()));
    }

    @GetMapping("/supplier")
    @Operation(summary = "Supplier dashboard - performance, delivery time, top by spend")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupplierDashboard() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getSupplierDashboard()));
    }

    @GetMapping("/management")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Management KPI dashboard - revenue, valuation, alerts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getManagementDashboard() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getManagementDashboard()));
    }
}
