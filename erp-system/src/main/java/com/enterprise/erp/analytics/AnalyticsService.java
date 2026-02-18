package com.enterprise.erp.analytics;

import com.enterprise.erp.entity.enums.MovementType;
import com.enterprise.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final InventoryRepository inventoryRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InventoryMovementRepository movementRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final ProductRepository productRepository;

    // ================================================================
    // INVENTORY DASHBOARD
    // ================================================================
    @Transactional(readOnly = true)
    public Map<String, Object> getInventoryDashboard() {
        Map<String, Object> dashboard = new LinkedHashMap<>();

        // Total SKUs
        dashboard.put("totalProducts", productRepository.count());

        // Low stock items
        var lowStock = inventoryRepository.findLowStockItems();
        dashboard.put("lowStockCount", lowStock.size());
        dashboard.put("lowStockItems", lowStock.stream().map(inv -> Map.of(
            "productId", inv.getProduct().getId(),
            "sku", inv.getProduct().getSku(),
            "name", inv.getProduct().getName(),
            "quantity", inv.getQuantity(),
            "reorderLevel", inv.getProduct().getReorderLevel(),
            "warehouse", inv.getWarehouse().getName()
        )).toList());

        // Out of stock
        var outOfStock = inventoryRepository.findOutOfStockItems();
        dashboard.put("outOfStockCount", outOfStock.size());
        dashboard.put("outOfStockItems", outOfStock.stream().map(inv -> Map.of(
            "productId", inv.getProduct().getId(),
            "sku", inv.getProduct().getSku(),
            "name", inv.getProduct().getName(),
            "warehouse", inv.getWarehouse().getName()
        )).toList());

        // Fast moving products (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Object[]> fastMoving = movementRepository.findFastMovingProducts(
            MovementType.SALE, thirtyDaysAgo, PageRequest.of(0, 10));
        dashboard.put("fastMovingProducts", fastMoving.stream().map(row -> Map.of(
            "productId", row[0],
            "totalSoldQty", row[1]
        )).toList());

        // Total inventory valuation
        BigDecimal totalValuation = inventoryRepository.findAll().stream()
            .map(inv -> inv.getProduct().getCostPrice()
                .multiply(BigDecimal.valueOf(inv.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        dashboard.put("totalInventoryValuation", totalValuation);

        log.debug("Inventory dashboard generated");
        return dashboard;
    }

    // ================================================================
    // ORDER DASHBOARD
    // ================================================================
    @Transactional(readOnly = true)
    public Map<String, Object> getOrderDashboard() {
        Map<String, Object> dashboard = new LinkedHashMap<>();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfWeek = now.minusDays(7);
        LocalDateTime startOfMonth = now.withDayOfMonth(1).toLocalDate().atStartOfDay();

        // Daily, weekly, monthly order stats
        dashboard.put("dailyStats", salesOrderRepository.getDailyOrderStats(startOfDay));
        dashboard.put("weeklyStats", salesOrderRepository.getDailyOrderStats(startOfWeek));
        dashboard.put("monthlyStats", salesOrderRepository.getDailyOrderStats(startOfMonth));

        // Order status distribution
        List<Object[]> statusDist = salesOrderRepository.getOrderStatusDistribution();
        Map<String, Long> statusMap = new LinkedHashMap<>();
        for (Object[] row : statusDist) {
            statusMap.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        dashboard.put("statusDistribution", statusMap);

        // Revenue (current month)
        BigDecimal monthRevenue = salesOrderRepository.getTotalRevenue(startOfMonth, now);
        dashboard.put("monthlyRevenue", monthRevenue != null ? monthRevenue : BigDecimal.ZERO);

        // Top 10 selling products (last 30 days)
        List<Object[]> topProducts = salesOrderItemRepository.findTopSellingProducts(now.minusDays(30));
        dashboard.put("topSellingProducts", topProducts.stream().map(row -> Map.of(
            "productId", row[0],
            "totalQuantity", row[1],
            "totalRevenue", row[2]
        )).limit(10).toList());

        return dashboard;
    }

    // ================================================================
    // SUPPLIER DASHBOARD
    // ================================================================
    @Transactional(readOnly = true)
    public Map<String, Object> getSupplierDashboard() {
        Map<String, Object> dashboard = new LinkedHashMap<>();

        // Supplier performance (avg delivery time)
        List<Object[]> performance = purchaseOrderRepository.getSupplierPerformance();
        dashboard.put("supplierPerformance", performance.stream().map(row -> Map.of(
            "supplierId", row[0],
            "supplierName", row[1],
            "totalOrders", row[2],
            "avgDeliveryDays", row[3]
        )).toList());

        // Top suppliers by spend
        List<Object[]> topBySpend = purchaseOrderRepository.getTopSuppliersBySpend(PageRequest.of(0, 10));
        dashboard.put("topSuppliersBySpend", topBySpend.stream().map(row -> Map.of(
            "supplierId", row[0],
            "supplierName", row[1],
            "orderCount", row[2],
            "totalSpend", row[3]
        )).toList());

        return dashboard;
    }

    // ================================================================
    // MANAGEMENT DASHBOARD (C-Level KPIs)
    // ================================================================
    @Transactional(readOnly = true)
    public Map<String, Object> getManagementDashboard() {
        Map<String, Object> dashboard = new LinkedHashMap<>();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).toLocalDate().atStartOfDay();
        LocalDateTime startOfYear = now.withDayOfYear(1).toLocalDate().atStartOfDay();

        // Revenue KPIs
        BigDecimal monthRevenue = salesOrderRepository.getTotalRevenue(startOfMonth, now);
        BigDecimal yearRevenue = salesOrderRepository.getTotalRevenue(startOfYear, now);
        dashboard.put("monthlyRevenue", monthRevenue != null ? monthRevenue : BigDecimal.ZERO);
        dashboard.put("yearlyRevenue", yearRevenue != null ? yearRevenue : BigDecimal.ZERO);

        // Total inventory valuation (SUM(quantity * cost_price))
        BigDecimal inventoryValue = inventoryRepository.findAll().stream()
            .map(inv -> inv.getProduct().getCostPrice()
                .multiply(BigDecimal.valueOf(inv.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        dashboard.put("inventoryValuation", inventoryValue);

        // Total active products, suppliers, customers
        dashboard.put("totalActiveProducts", productRepository.findAllActiveProducts().size());

        // Low stock alert count
        dashboard.put("lowStockAlerts", inventoryRepository.findLowStockItems().size());
        dashboard.put("outOfStockAlerts", inventoryRepository.findOutOfStockItems().size());

        // Pending orders
        long pendingSalesOrders = salesOrderRepository.count();
        dashboard.put("totalSalesOrders", pendingSalesOrders);
        dashboard.put("totalPurchaseOrders", purchaseOrderRepository.count());

        return dashboard;
    }
}
