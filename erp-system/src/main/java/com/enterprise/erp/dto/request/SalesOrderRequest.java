package com.enterprise.erp.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SalesOrderRequest {
    @NotNull private Long customerId;
    @NotNull private Long warehouseId;
    private LocalDate requestedDate;
    private String notes;
    @NotEmpty private List<SalesOrderItemRequest> items;
}
