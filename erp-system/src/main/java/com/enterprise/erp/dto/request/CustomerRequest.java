package com.enterprise.erp.dto.request;
import com.enterprise.erp.entity.enums.CustomerStatus;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CustomerRequest {
    @NotBlank @Size(max = 255) private String name;
    @Email private String email;
    private String phone;
    private String address;
    private String city;
    private String country;
    private String taxId;
    private BigDecimal creditLimit = BigDecimal.ZERO;
    private CustomerStatus status = CustomerStatus.ACTIVE;
}
