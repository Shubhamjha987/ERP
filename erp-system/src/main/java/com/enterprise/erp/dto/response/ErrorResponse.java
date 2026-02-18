package com.enterprise.erp.dto.response;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String message;
    private String errorCode;
    private String path;
    private Map<String, String> validationErrors;
}
