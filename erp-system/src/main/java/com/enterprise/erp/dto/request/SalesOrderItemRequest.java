package com.enterprise.erp.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SalesOrderItemRequest {
    @NotNull private Long productId;
    @Min(1) private Integer quantity;
    @NotNull @DecimalMin("0.0") private BigDecimal unitPrice;
    private String notes;
}
