package com.enterprise.erp.dto.request;
import com.enterprise.erp.entity.enums.WarehouseStatus;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WarehouseRequest {
    @NotBlank @Size(max = 255) private String name;
    @NotBlank @Size(max = 50) private String code;
    private String location;
    private String city;
    private String country;
    private WarehouseStatus status = WarehouseStatus.ACTIVE;
}
