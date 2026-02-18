package com.enterprise.erp.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InventoryAdjustRequest {
    @NotNull private Long productId;
    @NotNull private Long warehouseId;
    @NotNull private Integer quantity;  // positive = add, negative = subtract
    private String notes;
}
