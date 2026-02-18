package com.enterprise.erp.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PurchaseOrderItemRequest {
    @NotNull private Long productId;
    @Min(1) private Integer quantity;
    @NotNull @DecimalMin("0.0") private BigDecimal unitCost;
    private String notes;
}
