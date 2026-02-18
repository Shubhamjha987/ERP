package com.enterprise.erp.repository;

import com.enterprise.erp.entity.PurchaseOrder;
import com.enterprise.erp.entity.enums.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    Optional<PurchaseOrder> findByOrderNumber(String orderNumber);

    Page<PurchaseOrder> findBySupplierId(Long supplierId, Pageable pageable);

    Page<PurchaseOrder> findByStatus(PurchaseOrderStatus status, Pageable pageable);

    @Query("SELECT po FROM PurchaseOrder po JOIN FETCH po.items i JOIN FETCH i.product WHERE po.id = :id")
    Optional<PurchaseOrder> findByIdWithItems(@Param("id") Long id);

    // ---- SUPPLIER ANALYTICS ----

    @Query("""
        SELECT po.supplier.id,
               po.supplier.name,
               COUNT(po),
               AVG(DATEDIFF(DAY, po.createdAt, po.receivedAt))
        FROM PurchaseOrder po
        WHERE po.status = 'RECEIVED'
          AND po.receivedAt IS NOT NULL
        GROUP BY po.supplier.id, po.supplier.name
        """)
    List<Object[]> getSupplierPerformance();

    @Query("""
        SELECT po.supplier.id, po.supplier.name, COUNT(po), SUM(po.totalAmount)
        FROM PurchaseOrder po
        WHERE po.status != 'CANCELLED'
        GROUP BY po.supplier.id, po.supplier.name
        ORDER BY SUM(po.totalAmount) DESC
        """)
    List<Object[]> getTopSuppliersBySpend(Pageable pageable);
}