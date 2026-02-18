package com.enterprise.erp.dto.response;
import com.enterprise.erp.entity.enums.PurchaseOrderStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PurchaseOrderResponse {
    private Long id;
    private String orderNumber;
    private Long supplierId;
    private String supplierName;
    private Long warehouseId;
    private String warehouseName;
    private PurchaseOrderStatus status;
    private BigDecimal totalAmount;
    private String notes;
    private LocalDate expectedDate;
    private LocalDateTime receivedAt;
    private LocalDateTime createdAt;
    private List<PurchaseOrderItemResponse> items;
}
