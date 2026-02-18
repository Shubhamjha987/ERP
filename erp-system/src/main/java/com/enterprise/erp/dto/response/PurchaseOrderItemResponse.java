package com.enterprise.erp.dto.response;
import lombok.*;
import java.math.BigDecimal;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PurchaseOrderItemResponse {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private Integer quantity;
    private Integer receivedQuantity;
    private Integer pendingQuantity;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
}
