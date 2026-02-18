package com.enterprise.erp.dto.response;
import com.enterprise.erp.entity.enums.MovementType;
import com.enterprise.erp.entity.enums.ReferenceType;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InventoryMovementResponse {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private Long warehouseId;
    private String warehouseName;
    private MovementType movementType;
    private Integer quantity;
    private Integer quantityBefore;
    private Integer quantityAfter;
    private ReferenceType referenceType;
    private Long referenceId;
    private String notes;
    private LocalDateTime createdAt;
    private String createdBy;
}
