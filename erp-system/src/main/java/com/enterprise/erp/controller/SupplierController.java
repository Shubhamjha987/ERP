package com.enterprise.erp.controller;
import com.enterprise.erp.dto.request.SupplierRequest;
import com.enterprise.erp.dto.response.ApiResponse;
import com.enterprise.erp.dto.response.SupplierResponse;
import com.enterprise.erp.service.impl.SupplierService;
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
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Tag(name = "Suppliers")
@SecurityRequirement(name = "Bearer Authentication")
public class SupplierController {
    private final SupplierService supplierService;
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Create supplier")
    public ResponseEntity<ApiResponse<SupplierResponse>> create(@Valid @RequestBody SupplierRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Supplier created", supplierService.create(req)));
    }
    @GetMapping public ResponseEntity<ApiResponse<Page<SupplierResponse>>> getAll(
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getAll(PageRequest.of(page, size))));
    }
    @GetMapping("/{id}") public ResponseEntity<ApiResponse<SupplierResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getById(id)));
    }
    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<SupplierResponse>> update(@PathVariable Long id, @Valid @RequestBody SupplierRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Supplier updated", supplierService.update(id, req)));
    }
}
