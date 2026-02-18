package com.enterprise.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Enterprise ERP System - Main Application Entry Point
 *
 * Architecture:
 *  - Spring Boot 3.2 + Java 17
 *  - Spring Data JPA + Hibernate (DDL auto = update)
 *  - PostgreSQL 15+
 *  - Spring Security + JWT
 *  - Spring Batch for bulk operations
 *  - Spring Scheduler for automated jobs
 *  - OpenAPI / Swagger UI
 *
 * Hibernate will automatically create/update all tables on startup
 * based on @Entity annotations. No manual SQL migration needed.
 *
 * Access Swagger UI: http://localhost:8080/swagger-ui.html
 */
@SpringBootApplication
@EnableScheduling
@EnableTransactionManagement
public class ErpApplication {

    public static void main(String[] args) {
        SpringApplication.run(ErpApplication.class, args);
    }
}
