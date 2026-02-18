package com.enterprise.erp.dto.response;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InventoryResponse {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private Long warehouseId;
    private String warehouseName;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private BigDecimal stockValue;
    private String stockStatus;  // IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    private LocalDateTime lastUpdated;
}
