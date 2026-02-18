package com.enterprise.erp.config;

import com.enterprise.erp.entity.*;
import com.enterprise.erp.entity.enums.*;
import com.enterprise.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * DATA SEEDER
 * Runs on startup. Creates:
 *  - Default ADMIN user (admin / Admin@123)
 *  - Sample categories, products, warehouses, suppliers, customers
 *
 * Hibernate (ddl-auto=update) creates all tables first,
 * then this seeder populates initial data.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final SupplierRepository supplierRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedUsers();
        seedCategories();
        seedWarehouses();
        seedSuppliers();
        seedCustomers();
        seedProducts();
        log.info("=== ERP Data Seeding Complete ===");
    }

    private void seedUsers() {
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(User.builder()
                .username("admin")
                .email("admin@enterprise.com")
                .password(passwordEncoder.encode("Admin@123"))
                .firstName("System")
                .lastName("Administrator")
                .role(UserRole.ADMIN)
                .enabled(true)
                .build());
            log.info("Created default ADMIN user: admin / Admin@123");
        }

        if (!userRepository.existsByUsername("manager")) {
            userRepository.save(User.builder()
                .username("manager")
                .email("manager@enterprise.com")
                .password(passwordEncoder.encode("Manager@123"))
                .firstName("Inventory")
                .lastName("Manager")
                .role(UserRole.MANAGER)
                .enabled(true)
                .build());
            log.info("Created MANAGER user: manager / Manager@123");
        }

        if (!userRepository.existsByUsername("staff")) {
            userRepository.save(User.builder()
                .username("staff")
                .email("staff@enterprise.com")
                .password(passwordEncoder.encode("Staff@123"))
                .firstName("Warehouse")
                .lastName("Staff")
                .role(UserRole.STAFF)
                .enabled(true)
                .build());
            log.info("Created STAFF user: staff / Staff@123");
        }
    }

    private void seedCategories() {
        if (categoryRepository.count() == 0) {
            categoryRepository.save(Category.builder().name("Electronics").description("Electronic devices").build());
            categoryRepository.save(Category.builder().name("Office Supplies").description("Office stationery").build());
            categoryRepository.save(Category.builder().name("Furniture").description("Office furniture").build());
            categoryRepository.save(Category.builder().name("Software").description("Software licenses").build());
            log.info("Seeded 4 product categories");
        }
    }

    private void seedWarehouses() {
        if (warehouseRepository.count() == 0) {
            warehouseRepository.save(Warehouse.builder()
                .name("Main Warehouse").code("WH-001")
                .location("123 Industrial Ave").city("Chicago").country("USA")
                .status(WarehouseStatus.ACTIVE).build());
            warehouseRepository.save(Warehouse.builder()
                .name("East Coast Warehouse").code("WH-002")
                .location("456 Commerce Blvd").city("New York").country("USA")
                .status(WarehouseStatus.ACTIVE).build());
            log.info("Seeded 2 warehouses");
        }
    }

    private void seedSuppliers() {
        if (supplierRepository.count() == 0) {
            supplierRepository.save(Supplier.builder()
                .name("TechParts Inc").contactName("John Smith")
                .email("supplier@techparts.com").phone("+1-555-0100")
                .address("100 Tech Park").city("San Jose").country("USA")
                .paymentTerms(30).leadTime(7).status(SupplierStatus.ACTIVE).build());
            supplierRepository.save(Supplier.builder()
                .name("Global Supply Co").contactName("Jane Doe")
                .email("contact@globalsupply.com").phone("+1-555-0200")
                .address("200 Supply Chain Rd").city("Los Angeles").country("USA")
                .paymentTerms(45).leadTime(14).status(SupplierStatus.ACTIVE).build());
            log.info("Seeded 2 suppliers");
        }
    }

    private void seedCustomers() {
        if (customerRepository.count() == 0) {
            customerRepository.save(Customer.builder()
                .name("Acme Corporation").email("orders@acme.com").phone("+1-555-0300")
                .address("300 Business Park").city("Dallas").country("USA")
                .creditLimit(new BigDecimal("50000.00")).status(CustomerStatus.ACTIVE).build());
            customerRepository.save(Customer.builder()
                .name("Beta Enterprises").email("purchase@beta.com").phone("+1-555-0400")
                .address("400 Commerce St").city("Houston").country("USA")
                .creditLimit(new BigDecimal("25000.00")).status(CustomerStatus.ACTIVE).build());
            log.info("Seeded 2 customers");
        }
    }

    private void seedProducts() {
        if (productRepository.count() == 0) {
            Category electronics = categoryRepository.findByName("Electronics").orElse(null);
            Category office = categoryRepository.findByName("Office Supplies").orElse(null);

            productRepository.save(Product.builder()
                .sku("LAPTOP-001").name("Business Laptop Pro 15")
                .description("High-performance business laptop").category(electronics)
                .unitPrice(new BigDecimal("1299.99")).costPrice(new BigDecimal("900.00"))
                .reorderLevel(5).reorderQuantity(20).unitOfMeasure("EACH")
                .status(ProductStatus.ACTIVE).build());

            productRepository.save(Product.builder()
                .sku("MOUSE-001").name("Wireless Ergonomic Mouse")
                .description("Wireless mouse with ergonomic design").category(electronics)
                .unitPrice(new BigDecimal("49.99")).costPrice(new BigDecimal("25.00"))
                .reorderLevel(20).reorderQuantity(100).unitOfMeasure("EACH")
                .status(ProductStatus.ACTIVE).build());

            productRepository.save(Product.builder()
                .sku("PAPER-A4-001").name("A4 Printer Paper (500 sheets)")
                .description("Premium quality A4 paper").category(office)
                .unitPrice(new BigDecimal("12.99")).costPrice(new BigDecimal("6.00"))
                .reorderLevel(50).reorderQuantity(200).unitOfMeasure("REAM")
                .status(ProductStatus.ACTIVE).build());

            log.info("Seeded 3 sample products");
        }
    }
}
