package com.enterprise.erp.repository;
import com.enterprise.erp.entity.Customer;
import com.enterprise.erp.entity.enums.CustomerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByEmail(String email);
    boolean existsByEmail(String email);
    Page<Customer> findByStatus(CustomerStatus status, Pageable pageable);
    Page<Customer> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
