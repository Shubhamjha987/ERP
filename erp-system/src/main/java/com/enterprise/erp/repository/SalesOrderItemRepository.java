package com.enterprise.erp.repository;
import com.enterprise.erp.entity.SalesOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
@Repository
public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, Long> {
    @Query("""
        SELECT soi.product.id, SUM(soi.quantity), SUM(soi.quantity * soi.unitPrice)
        FROM SalesOrderItem soi
        JOIN soi.salesOrder so
        WHERE so.status NOT IN ('CANCELLED')
          AND so.createdAt >= :since
        GROUP BY soi.product.id
        ORDER BY SUM(soi.quantity) DESC
        """)
    List<Object[]> findTopSellingProducts(@Param("since") LocalDateTime since);
}
