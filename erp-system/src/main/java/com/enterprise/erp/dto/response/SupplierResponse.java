package com.enterprise.erp.dto.response;
import com.enterprise.erp.entity.enums.SupplierStatus;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SupplierResponse {
    private Long id;
    private String name;
    private String contactName;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String country;
    private Integer paymentTerms;
    private Integer leadTime;
    private SupplierStatus status;
    private LocalDateTime createdAt;
}
