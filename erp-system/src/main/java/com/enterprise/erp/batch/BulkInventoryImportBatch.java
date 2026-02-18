package com.enterprise.erp.batch;

import com.enterprise.erp.entity.Inventory;
import com.enterprise.erp.entity.Product;
import com.enterprise.erp.entity.Warehouse;
import com.enterprise.erp.entity.enums.MovementType;
import com.enterprise.erp.entity.enums.ReferenceType;
import com.enterprise.erp.entity.InventoryMovement;
import com.enterprise.erp.exception.ResourceNotFoundException;
import com.enterprise.erp.repository.InventoryMovementRepository;
import com.enterprise.erp.repository.InventoryRepository;
import com.enterprise.erp.repository.ProductRepository;
import com.enterprise.erp.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.*;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.launch.support.RunIdIncrementer;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.item.*;
import org.springframework.batch.item.support.ListItemReader;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Spring Batch configuration for bulk inventory import operations.
 *
 * Usage: Trigger via API or schedule to process large inventory files.
 * Chunk size = 100 rows per transaction for optimal performance.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class BulkInventoryImportBatch {

    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    /**
     * Bulk inventory update record (CSV/API input).
     */
    public record InventoryUpdateRecord(String sku, String warehouseCode, int quantity, String notes) {}

    @Bean
    public Job bulkInventoryImportJob(Step bulkInventoryStep) {
        return new JobBuilder("bulkInventoryImportJob", jobRepository)
            .incrementer(new RunIdIncrementer())
            .start(bulkInventoryStep)
            .build();
    }

    @Bean
    public Step bulkInventoryStep(
            ItemReader<InventoryUpdateRecord> bulkInventoryReader,
            ItemProcessor<InventoryUpdateRecord, Inventory> bulkInventoryProcessor,
            ItemWriter<Inventory> bulkInventoryWriter) {
        return new StepBuilder("bulkInventoryStep", jobRepository)
            .<InventoryUpdateRecord, Inventory>chunk(100, transactionManager)
            .reader(bulkInventoryReader)
            .processor(bulkInventoryProcessor)
            .writer(bulkInventoryWriter)
            .faultTolerant()
            .skipLimit(10)
            .skip(ResourceNotFoundException.class)
            .build();
    }

    @Bean
    @StepScope
    public ItemReader<InventoryUpdateRecord> bulkInventoryReader() {
        // In real system: read from CSV file, database, or API
        // This is a demonstration reader with sample data
        List<InventoryUpdateRecord> records = List.of(
            new InventoryUpdateRecord("SKU-001", "WH-001", 100, "Bulk import"),
            new InventoryUpdateRecord("SKU-002", "WH-001", 50, "Bulk import")
        );
        return new ListItemReader<>(records);
    }

    @Bean
    @StepScope
    public ItemProcessor<InventoryUpdateRecord, Inventory> bulkInventoryProcessor() {
        return record -> {
            Product product = productRepository.findBySku(record.sku())
                .orElseThrow(() -> new ResourceNotFoundException("Product SKU not found: " + record.sku()));

            Warehouse warehouse = warehouseRepository.findByCode(record.warehouseCode())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse code not found: " + record.warehouseCode()));

            Inventory inventory = inventoryRepository
                .findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                .orElse(Inventory.builder()
                    .product(product)
                    .warehouse(warehouse)
                    .quantity(0)
                    .reservedQuantity(0)
                    .build());

            int oldQty = inventory.getQuantity();
            inventory.setQuantity(record.quantity());

            // Record movement for audit trail
            InventoryMovement movement = InventoryMovement.builder()
                .product(product)
                .warehouse(warehouse)
                .movementType(MovementType.ADJUSTMENT)
                .quantity(record.quantity() - oldQty)
                .quantityBefore(oldQty)
                .quantityAfter(record.quantity())
                .referenceType(ReferenceType.MANUAL)
                .notes("Batch import: " + record.notes())
                .createdBy("BATCH_JOB")
                .build();
            movementRepository.save(movement);

            log.info("Batch processed: SKU={}, NewQty={}", record.sku(), record.quantity());
            return inventory;
        };
    }

    @Bean
    @StepScope
    public ItemWriter<Inventory> bulkInventoryWriter() {
        return chunk -> {
            inventoryRepository.saveAll(chunk.getItems());
            log.info("Batch committed {} inventory records", chunk.getItems().size());
        };
    }
}
