package com.enterprise.erp.service.impl;
import com.enterprise.erp.dto.request.SupplierRequest;
import com.enterprise.erp.dto.response.SupplierResponse;
import com.enterprise.erp.entity.Supplier;
import com.enterprise.erp.exception.DuplicateResourceException;
import com.enterprise.erp.exception.ResourceNotFoundException;
import com.enterprise.erp.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor @Slf4j
public class SupplierService {
    private final SupplierRepository supplierRepository;
    @Transactional
    public SupplierResponse create(SupplierRequest req) {
        if (req.getEmail() != null && supplierRepository.existsByEmail(req.getEmail()))
            throw new DuplicateResourceException("Supplier email already exists: " + req.getEmail());
        return toResponse(supplierRepository.save(Supplier.builder()
            .name(req.getName()).contactName(req.getContactName()).email(req.getEmail())
            .phone(req.getPhone()).address(req.getAddress()).city(req.getCity())
            .country(req.getCountry()).taxId(req.getTaxId())
            .paymentTerms(req.getPaymentTerms()).leadTime(req.getLeadTime())
            .status(req.getStatus()).build()));
    }
    @Transactional
    public SupplierResponse update(Long id, SupplierRequest req) {
        Supplier s = supplierRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
        s.setName(req.getName()); s.setContactName(req.getContactName());
        s.setEmail(req.getEmail()); s.setPhone(req.getPhone()); s.setAddress(req.getAddress());
        s.setCity(req.getCity()); s.setCountry(req.getCountry()); s.setPaymentTerms(req.getPaymentTerms());
        s.setLeadTime(req.getLeadTime()); s.setStatus(req.getStatus());
        return toResponse(supplierRepository.save(s));
    }
    @Transactional(readOnly = true)
    public SupplierResponse getById(Long id) {
        return toResponse(supplierRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Supplier", id)));
    }
    @Transactional(readOnly = true)
    public Page<SupplierResponse> getAll(Pageable pageable) { return supplierRepository.findAll(pageable).map(this::toResponse); }
    private SupplierResponse toResponse(Supplier s) {
        return SupplierResponse.builder().id(s.getId()).name(s.getName()).contactName(s.getContactName())
            .email(s.getEmail()).phone(s.getPhone()).address(s.getAddress()).city(s.getCity())
            .country(s.getCountry()).paymentTerms(s.getPaymentTerms()).leadTime(s.getLeadTime())
            .status(s.getStatus()).createdAt(s.getCreatedAt()).build();
    }
}
