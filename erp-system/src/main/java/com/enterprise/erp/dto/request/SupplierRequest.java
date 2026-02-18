package com.enterprise.erp.dto.request;
import com.enterprise.erp.entity.enums.SupplierStatus;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SupplierRequest {
    @NotBlank @Size(max = 255) private String name;
    private String contactName;
    @Email private String email;
    private String phone;
    private String address;
    private String city;
    private String country;
    private String taxId;
    private Integer paymentTerms = 30;
    private Integer leadTime = 7;
    private SupplierStatus status = SupplierStatus.ACTIVE;
}
