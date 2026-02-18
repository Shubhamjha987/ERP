package com.enterprise.erp.repository;

import com.enterprise.erp.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByProductIdAndWarehouseId(Long productId, Long warehouseId);

    /**
     * PESSIMISTIC WRITE LOCK (SELECT ... FOR UPDATE in PostgreSQL).
     * Used during reservation and stock deduction to prevent concurrent overselling.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.product.id = :productId AND i.warehouse.id = :warehouseId")
    Optional<Inventory> findByProductAndWarehouseForUpdate(
        @Param("productId") Long productId,
        @Param("warehouseId") Long warehouseId
    );

    @Query("SELECT i FROM Inventory i JOIN FETCH i.product JOIN FETCH i.warehouse WHERE i.warehouse.id = :warehouseId")
    List<Inventory> findByWarehouseIdWithDetails(@Param("warehouseId") Long warehouseId);

    @Query("""
        SELECT i FROM Inventory i
        JOIN FETCH i.product p
        WHERE p.reorderLevel > 0
          AND i.quantity <= p.reorderLevel
          AND p.status = 'ACTIVE'
        """)
    List<Inventory> findLowStockItems();

    @Query("SELECT i FROM Inventory i WHERE i.quantity = 0 AND i.product.status = 'ACTIVE'")
    List<Inventory> findOutOfStockItems();

    @Query("SELECT i FROM Inventory i JOIN FETCH i.product JOIN FETCH i.warehouse WHERE i.product.id = :productId")
    List<Inventory> findByProductIdWithDetails(@Param("productId") Long productId);

    /**
     * Bulk update available quantity - for batch operations.
     */
    @Modifying
    @Query("UPDATE Inventory i SET i.quantity = i.quantity + :delta WHERE i.product.id = :productId AND i.warehouse.id = :warehouseId")
    int adjustQuantity(
        @Param("productId") Long productId,
        @Param("warehouseId") Long warehouseId,
        @Param("delta") int delta
    );
}
