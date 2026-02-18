package com.enterprise.erp.repository;

import com.enterprise.erp.entity.SalesOrder;
import com.enterprise.erp.entity.enums.SalesOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    Optional<SalesOrder> findByOrderNumber(String orderNumber);

    Page<SalesOrder> findByStatus(SalesOrderStatus status, Pageable pageable);

    Page<SalesOrder> findByCustomerId(Long customerId, Pageable pageable);

    @Query("SELECT so FROM SalesOrder so JOIN FETCH so.items i JOIN FETCH i.product WHERE so.id = :id")
    Optional<SalesOrder> findByIdWithItems(@Param("id") Long id);

    // ---- ANALYTICS QUERIES ----

    @Query("""
        SELECT FUNCTION('DATE', so.createdAt), COUNT(so), SUM(so.totalAmount)
        FROM SalesOrder so
        WHERE so.status NOT IN ('CANCELLED')
          AND so.createdAt >= :since
        GROUP BY FUNCTION('DATE', so.createdAt)
        ORDER BY FUNCTION('DATE', so.createdAt) DESC
        """)
    List<Object[]> getDailyOrderStats(@Param("since") LocalDateTime since);

    @Query("""
        SELECT so.status, COUNT(so)
        FROM SalesOrder so
        GROUP BY so.status
        """)
    List<Object[]> getOrderStatusDistribution();

    @Query("""
        SELECT SUM(so.totalAmount)
        FROM SalesOrder so
        WHERE so.status NOT IN ('CANCELLED')
          AND so.createdAt BETWEEN :from AND :to
        """)
    BigDecimal getTotalRevenue(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
        SELECT so FROM SalesOrder so
        WHERE so.status NOT IN ('CANCELLED', 'DELIVERED')
          AND so.createdAt < :cutoff
        """)
    List<SalesOrder> findStaleOrders(@Param("cutoff") LocalDateTime cutoff);
}
