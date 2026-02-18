package com.enterprise.erp.service.impl;
import com.enterprise.erp.dto.request.CustomerRequest;
import com.enterprise.erp.dto.response.CustomerResponse;
import com.enterprise.erp.entity.Customer;
import com.enterprise.erp.exception.DuplicateResourceException;
import com.enterprise.erp.exception.ResourceNotFoundException;
import com.enterprise.erp.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor
public class CustomerService {
    private final CustomerRepository customerRepository;
    @Transactional
    public CustomerResponse create(CustomerRequest req) {
        if (req.getEmail() != null && customerRepository.existsByEmail(req.getEmail()))
            throw new DuplicateResourceException("Customer email already exists: " + req.getEmail());
        return toResponse(customerRepository.save(Customer.builder()
            .name(req.getName()).email(req.getEmail()).phone(req.getPhone())
            .address(req.getAddress()).city(req.getCity()).country(req.getCountry())
            .taxId(req.getTaxId()).creditLimit(req.getCreditLimit()).status(req.getStatus()).build()));
    }
    @Transactional
    public CustomerResponse update(Long id, CustomerRequest req) {
        Customer c = customerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        c.setName(req.getName()); c.setEmail(req.getEmail()); c.setPhone(req.getPhone());
        c.setAddress(req.getAddress()); c.setCity(req.getCity()); c.setCountry(req.getCountry());
        c.setCreditLimit(req.getCreditLimit()); c.setStatus(req.getStatus());
        return toResponse(customerRepository.save(c));
    }
    @Transactional(readOnly = true)
    public CustomerResponse getById(Long id) {
        return toResponse(customerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Customer", id)));
    }
    @Transactional(readOnly = true)
    public Page<CustomerResponse> getAll(Pageable pageable) { return customerRepository.findAll(pageable).map(this::toResponse); }
    private CustomerResponse toResponse(Customer c) {
        return CustomerResponse.builder().id(c.getId()).name(c.getName()).email(c.getEmail())
            .phone(c.getPhone()).address(c.getAddress()).city(c.getCity()).country(c.getCountry())
            .creditLimit(c.getCreditLimit()).status(c.getStatus()).createdAt(c.getCreatedAt()).build();
    }
}
