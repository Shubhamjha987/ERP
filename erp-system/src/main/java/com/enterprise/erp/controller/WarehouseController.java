package com.enterprise.erp.controller;
import com.enterprise.erp.dto.request.WarehouseRequest;
import com.enterprise.erp.dto.response.ApiResponse;
import com.enterprise.erp.dto.response.WarehouseResponse;
import com.enterprise.erp.service.impl.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
@Tag(name = "Warehouses")
@SecurityRequirement(name = "Bearer Authentication")
public class WarehouseController {
    private final WarehouseService warehouseService;
    @PostMapping @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> create(@Valid @RequestBody WarehouseRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Warehouse created", warehouseService.create(req)));
    }
    @GetMapping public ResponseEntity<ApiResponse<Page<WarehouseResponse>>> getAll(
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(warehouseService.getAll(PageRequest.of(page, size))));
    }
    @GetMapping("/{id}") public ResponseEntity<ApiResponse<WarehouseResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(warehouseService.getById(id)));
    }
}
