package com.enterprise.erp.dto.response;
import com.enterprise.erp.entity.enums.WarehouseStatus;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WarehouseResponse {
    private Long id;
    private String name;
    private String code;
    private String location;
    private String city;
    private String country;
    private WarehouseStatus status;
    private LocalDateTime createdAt;
}
