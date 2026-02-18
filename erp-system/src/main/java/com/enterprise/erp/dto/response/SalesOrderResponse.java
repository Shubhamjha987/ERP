package com.enterprise.erp.dto.response;
import com.enterprise.erp.entity.enums.SalesOrderStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SalesOrderResponse {
    private Long id;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private Long warehouseId;
    private String warehouseName;
    private SalesOrderStatus status;
    private BigDecimal totalAmount;
    private String notes;
    private LocalDate requestedDate;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime createdAt;
    private List<SalesOrderItemResponse> items;
}
