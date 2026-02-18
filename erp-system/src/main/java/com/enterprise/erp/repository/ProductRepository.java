package com.enterprise.erp.repository;

import com.enterprise.erp.entity.Product;
import com.enterprise.erp.entity.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' ORDER BY p.name")
    List<Product> findAllActiveProducts();

    @Query("""
        SELECT p FROM Product p
        WHERE p.status = :status
          AND (:name IS NULL OR UPPER(p.name) LIKE UPPER(CONCAT('%', :name, '%')))
          AND (:sku IS NULL OR p.sku LIKE CONCAT('%', :sku, '%'))
        """)
    Page<Product> searchProducts(
        @Param("status") ProductStatus status,
        @Param("name") String name,
        @Param("sku") String sku,
        Pageable pageable
    );

    @Query("SELECT p FROM Product p JOIN FETCH p.category WHERE p.id = :id")
    Optional<Product> findByIdWithCategory(@Param("id") Long id);
}
