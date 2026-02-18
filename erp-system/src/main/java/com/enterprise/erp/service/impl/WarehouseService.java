package com.enterprise.erp.service.impl;
import com.enterprise.erp.dto.request.WarehouseRequest;
import com.enterprise.erp.dto.response.WarehouseResponse;
import com.enterprise.erp.entity.Warehouse;
import com.enterprise.erp.exception.DuplicateResourceException;
import com.enterprise.erp.exception.ResourceNotFoundException;
import com.enterprise.erp.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor
public class WarehouseService {
    private final WarehouseRepository warehouseRepository;
    @Transactional
    public WarehouseResponse create(WarehouseRequest req) {
        if (warehouseRepository.existsByCode(req.getCode()))
            throw new DuplicateResourceException("Warehouse code exists: " + req.getCode());
        return toResponse(warehouseRepository.save(Warehouse.builder()
            .name(req.getName()).code(req.getCode()).location(req.getLocation())
            .city(req.getCity()).country(req.getCountry()).status(req.getStatus()).build()));
    }
    @Transactional(readOnly = true)
    public WarehouseResponse getById(Long id) {
        return toResponse(warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse", id)));
    }
    @Transactional(readOnly = true)
    public Page<WarehouseResponse> getAll(Pageable pageable) { return warehouseRepository.findAll(pageable).map(this::toResponse); }
    private WarehouseResponse toResponse(Warehouse w) {
        return WarehouseResponse.builder().id(w.getId()).name(w.getName()).code(w.getCode())
            .location(w.getLocation()).city(w.getCity()).country(w.getCountry())
            .status(w.getStatus()).createdAt(w.getCreatedAt()).build();
    }
}
