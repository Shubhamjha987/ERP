package com.enterprise.erp.scheduler;

import com.enterprise.erp.entity.Inventory;
import com.enterprise.erp.entity.SalesOrder;
import com.enterprise.erp.repository.InventoryRepository;
import com.enterprise.erp.repository.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class ERPScheduler {

    private final InventoryRepository inventoryRepository;
    private final SalesOrderRepository salesOrderRepository;

    /**
     * LOW STOCK ALERT
     * Runs every day at 8:00 AM.
     * Logs all products that have fallen below their reorder level.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void runLowStockAlert() {
        log.info("=== [SCHEDULER] Running Low Stock Alert ===");
        List<Inventory> lowStockItems = inventoryRepository.findLowStockItems();

        if (lowStockItems.isEmpty()) {
            log.info("[LOW STOCK] All products have sufficient stock.");
            return;
        }

        log.warn("[LOW STOCK ALERT] {} products are at or below reorder level:", lowStockItems.size());
        for (Inventory inv : lowStockItems) {
            log.warn("  - SKU: {} | Name: {} | Warehouse: {} | Qty: {} | Reorder Level: {}",
                inv.getProduct().getSku(),
                inv.getProduct().getName(),
                inv.getWarehouse().getName(),
                inv.getQuantity(),
                inv.getProduct().getReorderLevel()
            );
            // TODO: Integrate with Email/Notification service to alert procurement team
        }
    }

    /**
     * OUT OF STOCK ALERT
     * Runs every 4 hours.
     * Logs products with zero stock to trigger immediate restocking.
     */
    @Scheduled(cron = "0 0 */4 * * *")
    public void runOutOfStockAlert() {
        log.info("=== [SCHEDULER] Checking Out-of-Stock Items ===");
        List<Inventory> outOfStock = inventoryRepository.findOutOfStockItems();

        if (!outOfStock.isEmpty()) {
            log.warn("[OUT OF STOCK] {} products are completely out of stock!", outOfStock.size());
            outOfStock.forEach(inv ->
                log.warn("  URGENT - SKU: {} | Warehouse: {}",
                    inv.getProduct().getSku(), inv.getWarehouse().getName())
            );
        }
    }

    /**
     * STALE ORDER DETECTION
     * Runs every day at 9:00 AM.
     * Flags sales orders that have been in CREATED/CONFIRMED state for > 2 days.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void runStaleOrderCheck() {
        log.info("=== [SCHEDULER] Checking for Stale Orders ===");
        LocalDateTime cutoff = LocalDateTime.now().minusDays(2);
        List<SalesOrder> staleOrders = salesOrderRepository.findStaleOrders(cutoff);

        if (!staleOrders.isEmpty()) {
            log.warn("[STALE ORDERS] {} orders require attention:", staleOrders.size());
            staleOrders.forEach(order ->
                log.warn("  Order: {} | Status: {} | Created: {}",
                    order.getOrderNumber(), order.getStatus(), order.getCreatedAt())
            );
        }
    }

    /**
     * INVENTORY RECONCILIATION
     * Runs every Sunday at 2:00 AM.
     * Validates inventory integrity - checks for any inconsistencies.
     */
    @Scheduled(cron = "0 0 2 * * SUN")
    public void runInventoryReconciliation() {
        log.info("=== [SCHEDULER] Weekly Inventory Reconciliation START ===");

        List<Inventory> allInventory = inventoryRepository.findAll();
        int errorCount = 0;

        for (Inventory inv : allInventory) {
            if (inv.getQuantity() < 0) {
                log.error("[RECONCILIATION] CRITICAL: Negative qty for SKU: {} in warehouse: {}",
                    inv.getProduct().getSku(), inv.getWarehouse().getName());
                errorCount++;
            }
            if (inv.getReservedQuantity() > inv.getQuantity()) {
                log.error("[RECONCILIATION] Reserved > Total for SKU: {} in warehouse: {}. Qty: {}, Reserved: {}",
                    inv.getProduct().getSku(), inv.getWarehouse().getName(),
                    inv.getQuantity(), inv.getReservedQuantity());
                errorCount++;
            }
        }

        if (errorCount == 0) {
            log.info("[RECONCILIATION] All {} inventory records are consistent.", allInventory.size());
        } else {
            log.error("[RECONCILIATION] Found {} integrity violations!", errorCount);
            // TODO: Alert system administrators
        }

        log.info("=== [SCHEDULER] Weekly Inventory Reconciliation END ===");
    }

    /**
     * DASHBOARD CACHE REFRESH
     * Runs every 30 minutes during business hours.
     */
    @Scheduled(cron = "0 */30 8-20 * * MON-FRI")
    public void refreshDashboardCache() {
        log.debug("[SCHEDULER] Dashboard cache refresh triggered");
        // TODO: Integrate with Spring Cache eviction
        // cacheManager.getCache("inventoryDashboard").clear();
    }
}
