package com.enterprise.erp.service.impl;

import com.enterprise.erp.dto.request.ProductRequest;
import com.enterprise.erp.dto.response.ProductResponse;
import com.enterprise.erp.entity.Category;
import com.enterprise.erp.entity.Product;
import com.enterprise.erp.entity.enums.ProductStatus;
import com.enterprise.erp.exception.DuplicateResourceException;
import com.enterprise.erp.exception.ResourceNotFoundException;
import com.enterprise.erp.repository.CategoryRepository;
import com.enterprise.erp.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("Product with SKU already exists: " + request.getSku());
        }
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
        }
        Product product = Product.builder()
            .sku(request.getSku())
            .name(request.getName())
            .description(request.getDescription())
            .category(category)
            .unitPrice(request.getUnitPrice())
            .costPrice(request.getCostPrice())
            .reorderLevel(request.getReorderLevel())
            .reorderQuantity(request.getReorderQuantity())
            .unitOfMeasure(request.getUnitOfMeasure())
            .status(request.getStatus())
            .build();
        Product saved = productRepository.save(product);
        log.info("Product created: {}", saved.getSku());
        return toResponse(saved);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        if (!product.getSku().equals(request.getSku()) && productRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("SKU already in use: " + request.getSku());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
            product.setCategory(category);
        }
        product.setSku(request.getSku());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setUnitPrice(request.getUnitPrice());
        product.setCostPrice(request.getCostPrice());
        product.setReorderLevel(request.getReorderLevel());
        product.setReorderQuantity(request.getReorderQuantity());
        product.setUnitOfMeasure(request.getUnitOfMeasure());
        product.setStatus(request.getStatus());
        return toResponse(productRepository.save(product));
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        return toResponse(productRepository.findByIdWithCategory(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id)));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(ProductStatus status, String name, String sku, Pageable pageable) {
        return productRepository.searchProducts(status, name, sku, pageable).map(this::toResponse);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setStatus(ProductStatus.INACTIVE);
        productRepository.save(product);
        log.info("Product soft-deleted: {}", product.getSku());
    }

    private ProductResponse toResponse(Product p) {
        return ProductResponse.builder()
            .id(p.getId())
            .sku(p.getSku())
            .name(p.getName())
            .description(p.getDescription())
            .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
            .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
            .unitPrice(p.getUnitPrice())
            .costPrice(p.getCostPrice())
            .reorderLevel(p.getReorderLevel())
            .reorderQuantity(p.getReorderQuantity())
            .unitOfMeasure(p.getUnitOfMeasure())
            .status(p.getStatus())
            .version(p.getVersion())
            .createdAt(p.getCreatedAt())
            .updatedAt(p.getUpdatedAt())
            .build();
    }
}
