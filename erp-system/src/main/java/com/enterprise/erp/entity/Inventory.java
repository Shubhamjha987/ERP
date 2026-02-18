package com.enterprise.erp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "inventory",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_inventory_product_warehouse",
            columnNames = {"product_id", "warehouse_id"}
        )
    },
    indexes = {
        @Index(name = "idx_inventory_product_id", columnList = "product_id"),
        @Index(name = "idx_inventory_warehouse_id", columnList = "warehouse_id")
    }
)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    /**
     * Total on-hand quantity. Must NEVER go below 0.
     * Protected by: check constraint + pessimistic lock + @Version
     */
    @Column(name = "quantity", nullable = false)
    private Integer quantity = 0;

    /**
     * Reserved quantity for confirmed/picking sales orders.
     * Increased when order is CONFIRMED, decreased when SHIPPED.
     */
    @Column(name = "reserved_quantity", nullable = false)
    private Integer reservedQuantity = 0;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    /**
     * Optimistic locking - detects concurrent modifications.
     * Prevents lost updates without locking DB rows for long.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    /**
     * Derived: available = quantity - reserved
     * Not persisted, computed on access.
     */
    @Transient
    public Integer getAvailableQuantity() {
        return this.quantity - this.reservedQuantity;
    }

    @PreUpdate
    @PrePersist
    public void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
        // Safety guard: quantity must never go negative
        if (this.quantity < 0) {
            throw new IllegalStateException(
                "Inventory quantity cannot be negative for product: " + product.getSku()
            );
        }
        if (this.reservedQuantity < 0) {
            throw new IllegalStateException("Reserved quantity cannot be negative");
        }
        if (this.reservedQuantity > this.quantity) {
            throw new IllegalStateException(
                "Reserved quantity cannot exceed total quantity for product: " + product.getSku()
            );
        }
    }
}
