package com.enterprise.erp.dto.response;
import com.enterprise.erp.entity.enums.CustomerStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CustomerResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String country;
    private BigDecimal creditLimit;
    private CustomerStatus status;
    private LocalDateTime createdAt;
}
