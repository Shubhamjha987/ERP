package com.enterprise.erp.repository;

import com.enterprise.erp.entity.InventoryMovement;
import com.enterprise.erp.entity.enums.MovementType;
import com.enterprise.erp.entity.enums.ReferenceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

    Page<InventoryMovement> findByProductId(Long productId, Pageable pageable);

    Page<InventoryMovement> findByWarehouseId(Long warehouseId, Pageable pageable);

    List<InventoryMovement> findByReferenceTypeAndReferenceId(ReferenceType referenceType, Long referenceId);

    @Query("""
        SELECT im FROM InventoryMovement im
        JOIN FETCH im.product
        JOIN FETCH im.warehouse
        WHERE im.product.id = :productId
          AND im.createdAt BETWEEN :from AND :to
        ORDER BY im.createdAt DESC
        """)
    List<InventoryMovement> findProductMovementsInRange(
        @Param("productId") Long productId,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );

    @Query("""
        SELECT im.product.id, SUM(ABS(im.quantity))
        FROM InventoryMovement im
        WHERE im.movementType = :type
          AND im.createdAt >= :since
        GROUP BY im.product.id
        ORDER BY SUM(ABS(im.quantity)) DESC
        """)
    List<Object[]> findFastMovingProducts(
        @Param("type") MovementType type,
        @Param("since") LocalDateTime since,
        Pageable pageable
    );
}
