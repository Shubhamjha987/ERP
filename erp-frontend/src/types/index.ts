// ============================================================
// ERP SYSTEM - Complete TypeScript Types
// ============================================================

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type WarehouseStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type MovementType = 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'TRANSFER';
export type ReferenceType = 'PURCHASE_ORDER' | 'SALES_ORDER' | 'MANUAL';
export type PurchaseOrderStatus = 'CREATED' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
export type SalesOrderStatus = 'CREATED' | 'CONFIRMED' | 'PICKING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

// ---- AUTH ----
export interface LoginRequest { username: string; password: string; }
export interface JwtAuthResponse {
  accessToken: string; tokenType: string;
  expiresIn: number; username: string; role: UserRole;
}
export interface AuthUser { username: string; role: UserRole; token: string; }

// ---- API WRAPPER ----
export interface ApiResponse<T> {
  success: boolean; message?: string; data: T;
  timestamp: string;
}
export interface PageResponse<T> {
  content: T[]; totalElements: number; totalPages: number;
  size: number; number: number;
}
export interface ErrorResponse {
  timestamp: string; status: number; message: string;
  errorCode: string; path: string;
  validationErrors?: Record<string, string>;
}

// ---- PRODUCT ----
export interface Product {
  id: number; sku: string; name: string; description?: string;
  categoryId?: number; categoryName?: string;
  unitPrice: number; costPrice: number;
  reorderLevel: number; reorderQuantity: number;
  unitOfMeasure: string; status: ProductStatus;
  version: number; createdAt: string; updatedAt: string;
}
export interface ProductRequest {
  sku: string; name: string; description?: string;
  categoryId?: number; unitPrice: number; costPrice: number;
  reorderLevel: number; reorderQuantity: number;
  unitOfMeasure: string; status: ProductStatus;
}

// ---- INVENTORY ----
export interface Inventory {
  id: number; productId: number; productSku: string; productName: string;
  warehouseId: number; warehouseName: string;
  quantity: number; reservedQuantity: number; availableQuantity: number;
  stockValue: number; stockStatus: StockStatus; lastUpdated: string;
}
export interface InventoryAdjustRequest {
  productId: number; warehouseId: number; quantity: number; notes?: string;
}
export interface InventoryMovement {
  id: number; productId: number; productSku: string; productName: string;
  warehouseId: number; warehouseName: string;
  movementType: MovementType; quantity: number;
  quantityBefore: number; quantityAfter: number;
  referenceType?: ReferenceType; referenceId?: number;
  notes?: string; createdAt: string; createdBy: string;
}

// ---- SUPPLIER ----
export interface Supplier {
  id: number; name: string; contactName?: string;
  email?: string; phone?: string; address?: string;
  city?: string; country?: string; paymentTerms: number;
  leadTime: number; status: SupplierStatus; createdAt: string;
}
export interface SupplierRequest {
  name: string; contactName?: string; email?: string; phone?: string;
  address?: string; city?: string; country?: string;
  paymentTerms: number; leadTime: number; status: SupplierStatus;
}

// ---- CUSTOMER ----
export interface Customer {
  id: number; name: string; email?: string; phone?: string;
  address?: string; city?: string; country?: string;
  creditLimit: number; status: CustomerStatus; createdAt: string;
}

// ---- WAREHOUSE ----
export interface Warehouse {
  id: number; name: string; code: string;
  location?: string; city?: string; country?: string;
  status: WarehouseStatus; createdAt: string;
}

// ---- PURCHASE ORDER ----
export interface PurchaseOrderItem {
  id?: number; productId: number; productSku?: string; productName?: string;
  quantity: number; receivedQuantity?: number; pendingQuantity?: number;
  unitCost: number; totalCost?: number; notes?: string;
}
export interface PurchaseOrder {
  id: number; orderNumber: string;
  supplierId: number; supplierName: string;
  warehouseId: number; warehouseName: string;
  status: PurchaseOrderStatus; totalAmount: number;
  notes?: string; expectedDate?: string;
  receivedAt?: string; createdAt: string;
  items: PurchaseOrderItem[];
}
export interface PurchaseOrderRequest {
  supplierId: number; warehouseId: number;
  expectedDate?: string; notes?: string;
  items: { productId: number; quantity: number; unitCost: number; }[];
}

// ---- SALES ORDER ----
export interface SalesOrderItem {
  id?: number; productId: number; productSku?: string; productName?: string;
  quantity: number; unitPrice: number; totalPrice?: number; notes?: string;
}
export interface SalesOrder {
  id: number; orderNumber: string;
  customerId: number; customerName: string;
  warehouseId: number; warehouseName: string;
  status: SalesOrderStatus; totalAmount: number;
  notes?: string; requestedDate?: string;
  shippedAt?: string; deliveredAt?: string; createdAt: string;
  items: SalesOrderItem[];
}
export interface SalesOrderRequest {
  customerId: number; warehouseId: number;
  requestedDate?: string; notes?: string;
  items: { productId: number; quantity: number; unitPrice: number; }[];
}

// ---- USER ----
export interface User {
  id: number; username: string; email: string;
  firstName?: string; lastName?: string;
  role: UserRole; enabled: boolean; lastLogin?: string; createdAt: string;
}
export interface RegisterRequest {
  username: string; email: string; password: string;
  firstName?: string; lastName?: string; role: UserRole;
}

// ---- DASHBOARD ----
export interface InventoryDashboard {
  totalProducts: number; lowStockCount: number; outOfStockCount: number;
  totalInventoryValuation: number;
  lowStockItems: { productId: number; sku: string; name: string; quantity: number; reorderLevel: number; warehouse: string; }[];
  outOfStockItems: { productId: number; sku: string; name: string; warehouse: string; }[];
  fastMovingProducts: { productId: number; totalSoldQty: number; }[];
}
export interface OrderDashboard {
  monthlyRevenue: number; statusDistribution: Record<string, number>;
  topSellingProducts: { productId: number; totalQuantity: number; totalRevenue: number; }[];
}
export interface ManagementDashboard {
  monthlyRevenue: number; yearlyRevenue: number;
  inventoryValuation: number; totalActiveProducts: number;
  lowStockAlerts: number; outOfStockAlerts: number;
  totalSalesOrders: number; totalPurchaseOrders: number;
}
