import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, MenuItem, Tab, Tabs } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Tune, Warning, Block } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { inventoryApi, productApi, warehouseApi } from '../../api/endpoints';
import { formatCurrency, formatNumber } from '../../utils/format';
import { useAppSelector } from '../../hooks/redux';
import type { Inventory, InventoryAdjustRequest } from '../../types';

const STOCK_STATUS_COLOR = {
  IN_STOCK: 'success', LOW_STOCK: 'warning', OUT_OF_STOCK: 'error'
} as const;

export default function InventoryPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAppSelector(s => s.auth);
  const canAdjust = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [page, setPage] = useState(0);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page],
    queryFn: () => inventoryApi.getAll(page, 20),
  });
  const { data: lowStock } = useQuery({ queryKey: ['inventory-low'], queryFn: inventoryApi.getLowStock });
  const { data: outOfStock } = useQuery({ queryKey: ['inventory-oos'], queryFn: inventoryApi.getOutOfStock });
  const { data: products } = useQuery({ queryKey: ['products-all'], queryFn: () => productApi.getAll(0, 200) });
  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: warehouseApi.getAll });

  const adjustMutation = useMutation({
    mutationFn: inventoryApi.adjust,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      enqueueSnackbar('Inventory adjusted successfully', { variant: 'success' });
      setAdjustOpen(false);
      adjustForm.reset();
    },
    onError: (err: any) => enqueueSnackbar(err.response?.data?.message || 'Adjustment failed', { variant: 'error' }),
  });

  const adjustForm = useForm<InventoryAdjustRequest & { adjustType: 'add' | 'remove' }>({
    defaultValues: { productId: 0, warehouseId: 0, quantity: 1, notes: '', adjustType: 'add' },
  });

  const onAdjust = (data: InventoryAdjustRequest & { adjustType: 'add' | 'remove' }) => {
    const qty = data.adjustType === 'remove' ? -Math.abs(data.quantity) : Math.abs(data.quantity);
    adjustMutation.mutate({ productId: data.productId, warehouseId: data.warehouseId, quantity: qty, notes: data.notes });
  };

  const columns: GridColDef<Inventory>[] = [
    { field: 'productSku', headerName: 'SKU', width: 130,
      renderCell: ({ value }) => <Typography sx={{ fontFamily: '"IBM Plex Mono"', fontSize: 12, color: 'primary.main' }}>{value}</Typography> },
    { field: 'productName', headerName: 'Product', flex: 1, minWidth: 180 },
    { field: 'warehouseName', headerName: 'Warehouse', width: 160 },
    { field: 'quantity', headerName: 'On Hand', width: 100, align: 'right', headerAlign: 'right',
      renderCell: ({ value }) => <Typography fontWeight={700} fontSize={13}>{formatNumber(value)}</Typography> },
    { field: 'reservedQuantity', headerName: 'Reserved', width: 100, align: 'right', headerAlign: 'right',
      renderCell: ({ value }) => <Typography color="warning.main" fontSize={12}>{formatNumber(value)}</Typography> },
    { field: 'availableQuantity', headerName: 'Available', width: 110, align: 'right', headerAlign: 'right',
      renderCell: ({ value }) => <Typography fontWeight={600} color="success.main" fontSize={13}>{formatNumber(value)}</Typography> },
    { field: 'stockValue', headerName: 'Value', width: 120, align: 'right', headerAlign: 'right',
      renderCell: ({ value }) => <Typography fontSize={12}>{formatCurrency(value)}</Typography> },
    { field: 'stockStatus', headerName: 'Status', width: 120,
      renderCell: ({ value }) => (
        <Chip label={value?.replace('_', ' ')} size="small"
          color={STOCK_STATUS_COLOR[value as keyof typeof STOCK_STATUS_COLOR] || 'default'}
          sx={{ fontSize: 10, fontWeight: 600 }} />
      )
    },
  ];

  const displayData = tab === 0 ? data?.content : tab === 1 ? lowStock : outOfStock;
  const isServerPaged = tab === 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Inventory</Typography>
          <Typography variant="body2" color="text.secondary">Stock levels across all warehouses</Typography>
        </Box>
        {canAdjust && (
          <Button variant="contained" startIcon={<Tune />} onClick={() => setAdjustOpen(true)}>
            Adjust Stock
          </Button>
        )}
      </Box>

      {/* Alert Banner */}
      {(outOfStock?.length || 0) > 0 && (
        <Alert severity="error" icon={<Block />} sx={{ mb: 2 }}>
          <strong>{outOfStock!.length} products</strong> are out of stock and need immediate restocking.
        </Alert>
      )}
      {(lowStock?.length || 0) > 0 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          <strong>{lowStock!.length} products</strong> are at or below reorder level.
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`All Stock (${data?.totalElements ?? 0})`} />
        <Tab label={`Low Stock (${lowStock?.length ?? 0})`} sx={{ color: 'warning.main' }} />
        <Tab label={`Out of Stock (${outOfStock?.length ?? 0})`} sx={{ color: 'error.main' }} />
      </Tabs>

      <Box sx={{ height: 520, bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
        <DataGrid
          rows={displayData || []}
          columns={columns}
          loading={isLoading}
          {...(isServerPaged ? {
            paginationMode: 'server' as const,
            rowCount: data?.totalElements || 0,
            paginationModel: { page, pageSize: 20 },
            onPaginationModelChange: (m: { page: number }) => setPage(m.page),
          } : {})}
          pageSizeOptions={[20]}
          disableRowSelectionOnClick
          sx={{ border: 'none' }}
        />
      </Box>

      {/* Adjust Modal */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Inventory</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Controller name="productId" control={adjustForm.control}
              rules={{ required: true, min: 1 }}
              render={({ field }) => (
                <TextField {...field} select label="Product *" fullWidth>
                  {products?.content.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.name} ({p.sku})</MenuItem>
                  ))}
                </TextField>
              )} />
            <Controller name="warehouseId" control={adjustForm.control}
              rules={{ required: true, min: 1 }}
              render={({ field }) => (
                <TextField {...field} select label="Warehouse *" fullWidth>
                  {warehouses?.content.map(w => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </TextField>
              )} />
            <Controller name="adjustType" control={adjustForm.control}
              render={({ field }) => (
                <TextField {...field} select label="Adjustment Type" fullWidth>
                  <MenuItem value="add">➕ Add Stock (Positive)</MenuItem>
                  <MenuItem value="remove">➖ Remove Stock (Negative)</MenuItem>
                </TextField>
              )} />
            <Controller name="quantity" control={adjustForm.control}
              rules={{ required: true, min: 1 }}
              render={({ field }) => (
                <TextField {...field} label="Quantity *" type="number" fullWidth inputProps={{ min: 1 }} />
              )} />
            <Controller name="notes" control={adjustForm.control}
              render={({ field }) => (
                <TextField {...field} label="Reason / Notes" fullWidth multiline rows={2} />
              )} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={adjustForm.handleSubmit(onAdjust)}
            disabled={adjustMutation.isPending}>
            Apply Adjustment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
