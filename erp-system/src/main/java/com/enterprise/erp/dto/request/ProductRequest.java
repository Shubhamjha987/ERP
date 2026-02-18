package com.enterprise.erp.dto.request;
import com.enterprise.erp.entity.enums.ProductStatus;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductRequest {
    @NotBlank(message = "SKU is required")
    @Size(max = 100)
    private String sku;
    @NotBlank(message = "Product name is required")
    @Size(max = 255)
    private String name;
    private String description;
    private Long categoryId;
    @NotNull @DecimalMin("0.0")
    private BigDecimal unitPrice;
    @NotNull @DecimalMin("0.0")
    private BigDecimal costPrice;
    @Min(0) private Integer reorderLevel = 0;
    @Min(0) private Integer reorderQuantity = 0;
    private String unitOfMeasure = "EACH";
    private ProductStatus status = ProductStatus.ACTIVE;
}
