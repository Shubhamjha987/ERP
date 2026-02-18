package com.enterprise.erp.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PurchaseOrderRequest {
    @NotNull private Long supplierId;
    @NotNull private Long warehouseId;
    private LocalDate expectedDate;
    private String notes;
    @NotEmpty private List<PurchaseOrderItemRequest> items;
}
