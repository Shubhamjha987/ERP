package com.enterprise.erp.controller;
import com.enterprise.erp.dto.request.LoginRequest;
import com.enterprise.erp.dto.request.RegisterRequest;
import com.enterprise.erp.dto.response.ApiResponse;
import com.enterprise.erp.dto.response.JwtAuthResponse;
import com.enterprise.erp.service.impl.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "JWT Authentication endpoints")
public class AuthController {
    private final AuthService authService;
    @PostMapping("/login")
    @Operation(summary = "Login and get JWT token")
    public ResponseEntity<ApiResponse<JwtAuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.login(req)));
    }
    @PostMapping("/register")
    @Operation(summary = "Register new user (Admin only in production)")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(ApiResponse.success(authService.register(req)));
    }
}
