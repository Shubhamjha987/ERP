package com.enterprise.erp.repository;
import com.enterprise.erp.entity.Warehouse;
import com.enterprise.erp.entity.enums.WarehouseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    Optional<Warehouse> findByCode(String code);
    boolean existsByCode(String code);
    List<Warehouse> findByStatus(WarehouseStatus status);
}
