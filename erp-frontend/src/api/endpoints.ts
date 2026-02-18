import apiClient from './client';
import type {
  LoginRequest, JwtAuthResponse, ApiResponse, PageResponse,
  Product, ProductRequest, Inventory, InventoryAdjustRequest, InventoryMovement,
  Supplier, SupplierRequest, Customer, Warehouse,
  PurchaseOrder, PurchaseOrderRequest, SalesOrder, SalesOrderRequest,
  User, RegisterRequest, InventoryDashboard, OrderDashboard, ManagementDashboard
} from '../types';

const unwrap = <T>(res: { data: ApiResponse<T> }) => res.data.data;

// AUTH
export const authApi = {
  login: (data: LoginRequest) => apiClient.post<ApiResponse<JwtAuthResponse>>('/auth/login', data).then(unwrap),
  register: (data: RegisterRequest) => apiClient.post<ApiResponse<string>>('/auth/register', data).then(unwrap),
};

// PRODUCTS
export const productApi = {
  getAll: (page = 0, size = 20) => apiClient.get<ApiResponse<PageResponse<Product>>>(`/products?page=${page}&size=${size}`).then(unwrap),
  search: (params: Record<string, string | number>) => apiClient.get<ApiResponse<PageResponse<Product>>>('/products/search', { params }).then(unwrap),
  getById: (id: number) => apiClient.get<ApiResponse<Product>>(`/products/${id}`).then(unwrap),
  create: (data: ProductRequest) => apiClient.post<ApiResponse<Product>>('/products', data).then(unwrap),
  update: (id: number, data: ProductRequest) => apiClient.put<ApiResponse<Product>>(`/products/${id}`, data).then(unwrap),
  delete: (id: number) => apiClient.delete<ApiResponse<void>>(`/products/${id}`).then(unwrap),
};

// INVENTORY
export const inventoryApi = {
  getAll: (page = 0, size = 20) => apiClient.get<ApiResponse<PageResponse<Inventory>>>(`/inventory?page=${page}&size=${size}`).then(unwrap),
  getLowStock: () => apiClient.get<ApiResponse<Inventory[]>>('/inventory/low-stock').then(unwrap),
  getOutOfStock: () => apiClient.get<ApiResponse<Inventory[]>>('/inventory/out-of-stock').then(unwrap),
  adjust: (data: InventoryAdjustRequest) => apiClient.post<ApiResponse<Inventory>>('/inventory/adjust', data).then(unwrap),
  getMovements: (productId?: number, page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<InventoryMovement>>>(`/inventory/movements`, {
      params: { productId, page, size }
    }).then(unwrap),
};

// SUPPLIERS
export const supplierApi = {
  getAll: (page = 0, size = 20) => apiClient.get<ApiResponse<PageResponse<Supplier>>>(`/suppliers?page=${page}&size=${size}`).then(unwrap),
  getById: (id: number) => apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`).then(unwrap),
  create: (data: SupplierRequest) => apiClient.post<ApiResponse<Supplier>>('/suppliers', data).then(unwrap),
  update: (id: number, data: SupplierRequest) => apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data).then(unwrap),
};

// CUSTOMERS
export const customerApi = {
  getAll: (page = 0, size = 50) => apiClient.get<ApiResponse<PageResponse<Customer>>>(`/customers?page=${page}&size=${size}`).then(unwrap),
};

// WAREHOUSES
export const warehouseApi = {
  getAll: () => apiClient.get<ApiResponse<PageResponse<Warehouse>>>('/warehouses?size=50').then(unwrap),
};

// PURCHASE ORDERS
export const purchaseOrderApi = {
  getAll: (page = 0, size = 20) => apiClient.get<ApiResponse<PageResponse<PurchaseOrder>>>(`/purchase-orders?page=${page}&size=${size}`).then(unwrap),
  getById: (id: number) => apiClient.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`).then(unwrap),
  create: (data: PurchaseOrderRequest) => apiClient.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data).then(unwrap),
  approve: (id: number) => apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/approve`).then(unwrap),
  receive: (id: number) => apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/receive`).then(unwrap),
  cancel: (id: number) => apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/cancel`).then(unwrap),
};

// SALES ORDERS
export const salesOrderApi = {
  getAll: (page = 0, size = 20) => apiClient.get<ApiResponse<PageResponse<SalesOrder>>>(`/sales-orders?page=${page}&size=${size}`).then(unwrap),
  getById: (id: number) => apiClient.get<ApiResponse<SalesOrder>>(`/sales-orders/${id}`).then(unwrap),
  create: (data: SalesOrderRequest) => apiClient.post<ApiResponse<SalesOrder>>('/sales-orders', data).then(unwrap),
  confirm: (id: number) => apiClient.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/confirm`).then(unwrap),
  ship: (id: number) => apiClient.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/ship`).then(unwrap),
  deliver: (id: number) => apiClient.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/deliver`).then(unwrap),
  cancel: (id: number) => apiClient.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/cancel`).then(unwrap),
};

// DASHBOARD
export const dashboardApi = {
  getInventory: () => apiClient.get<ApiResponse<InventoryDashboard>>('/dashboard/inventory').then(unwrap),
  getOrders: () => apiClient.get<ApiResponse<OrderDashboard>>('/dashboard/orders').then(unwrap),
  getManagement: () => apiClient.get<ApiResponse<ManagementDashboard>>('/dashboard/management').then(unwrap),
  getSupplier: () => apiClient.get('/dashboard/supplier').then(unwrap),
};

// USERS
export const userApi = {
  getAll: () => apiClient.get<ApiResponse<User[]>>('/users').then(r => r.data.data),
};
