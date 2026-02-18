package com.enterprise.erp.entity;

import com.enterprise.erp.entity.enums.MovementType;
import com.enterprise.erp.entity.enums.ReferenceType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * CRITICAL AUDIT TABLE.
 * Every inventory change (in/out/transfer/adjustment) MUST create a record here.
 * This table is append-only (never update/delete).
 */
@Entity
@Table(
    name = "inventory_movements",
    indexes = {
        @Index(name = "idx_inv_mov_product_id", columnList = "product_id"),
        @Index(name = "idx_inv_mov_warehouse_id", columnList = "warehouse_id"),
        @Index(name = "idx_inv_mov_type", columnList = "movement_type"),
        @Index(name = "idx_inv_mov_created_at", columnList = "created_at"),
        @Index(name = "idx_inv_mov_reference", columnList = "reference_type,reference_id")
    }
)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 20)
    private MovementType movementType;

    /**
     * Positive = stock IN (e.g., purchase received)
     * Negative = stock OUT (e.g., sale shipped)
     */
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "quantity_before", nullable = false)
    private Integer quantityBefore;

    @Column(name = "quantity_after", nullable = false)
    private Integer quantityAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", length = 20)
    private ReferenceType referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
