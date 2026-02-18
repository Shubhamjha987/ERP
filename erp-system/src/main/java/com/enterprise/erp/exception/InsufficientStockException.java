package com.enterprise.erp.exception;
public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) { super(message); }
    public InsufficientStockException(String sku, int requested, int available) {
        super("Insufficient stock for SKU " + sku + ". Requested: " + requested + ", Available: " + available);
    }
}
