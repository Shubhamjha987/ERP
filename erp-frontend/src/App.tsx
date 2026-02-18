import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { store } from './redux/store';
import { useAppSelector } from './hooks/redux';
import { lightTheme, darkTheme } from './theme';
import AppLayout from './components/layout/AppLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

// Lazy-loaded pages
const Login = lazy(() => import('./pages/Login/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Products = lazy(() => import('./pages/Products/Products'));
const ProductForm = lazy(() => import('./pages/Products/ProductForm'));
const Inventory = lazy(() => import('./pages/Inventory/Inventory'));
const InventoryMovements = lazy(() => import('./pages/Inventory/InventoryMovements'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders/PurchaseOrders'));
const PurchaseOrderForm = lazy(() => import('./pages/PurchaseOrders/PurchaseOrderForm'));
const PurchaseOrderDetail = lazy(() => import('./pages/PurchaseOrders/PurchaseOrderDetail'));
const SalesOrders = lazy(() => import('./pages/SalesOrders/SalesOrders'));
const SalesOrderForm = lazy(() => import('./pages/SalesOrders/SalesOrderForm'));
const SalesOrderDetail = lazy(() => import('./pages/SalesOrders/SalesOrderDetail'));
const Suppliers = lazy(() => import('./pages/Suppliers/Suppliers'));
const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const Users = lazy(() => import('./pages/Users/Users'));

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { isAuthenticated, user } = useAppSelector(s => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAppSelector(s => s.auth);
  const { darkMode } = useAppSelector(s => s.ui);

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/new" element={<ProtectedRoute roles={['ADMIN','MANAGER']}><ProductForm /></ProtectedRoute>} />
              <Route path="/products/:id/edit" element={<ProtectedRoute roles={['ADMIN','MANAGER']}><ProductForm /></ProtectedRoute>} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/inventory/movements" element={<InventoryMovements />} />
              <Route path="/purchase-orders" element={<ProtectedRoute roles={['ADMIN','MANAGER']}><PurchaseOrders /></ProtectedRoute>} />
              <Route path="/purchase-orders/new" element={<ProtectedRoute roles={['ADMIN','MANAGER']}><PurchaseOrderForm /></ProtectedRoute>} />
              <Route path="/purchase-orders/:id" element={<ProtectedRoute roles={['ADMIN','MANAGER']}><PurchaseOrderDetail /></ProtectedRoute>} />
              <Route path="/sales-orders" element={<SalesOrders />} />
              <Route path="/sales-orders/new" element={<SalesOrderForm />} />
              <Route path="/sales-orders/:id" element={<SalesOrderDetail />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/analytics" element={<ProtectedRoute roles={['ADMIN','MANAGER']}><Analytics /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute roles={['ADMIN']}><Users /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
