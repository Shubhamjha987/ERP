import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Typography, Chip, MenuItem, TextField, Tooltip, IconButton } from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add, Visibility, CheckCircle, LocalShipping, Cancel } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { purchaseOrderApi } from '../../api/endpoints';
import { formatCurrency, formatDate } from '../../utils/format';
import type { PurchaseOrder, PurchaseOrderStatus } from '../../types';

const STATUS_COLORS: Record<PurchaseOrderStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  CREATED: 'default', APPROVED: 'info', PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success', CANCELLED: 'error',
};

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page],
    queryFn: () => purchaseOrderApi.getAll(page, 20),
  });

  const approveMutation = useMutation({
    mutationFn: purchaseOrderApi.approve,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); enqueueSnackbar('Order approved', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }),
  });
  const receiveMutation = useMutation({
    mutationFn: purchaseOrderApi.receive,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); enqueueSnackbar('Inventory updated from PO', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }),
  });
  const cancelMutation = useMutation({
    mutationFn: purchaseOrderApi.cancel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); enqueueSnackbar('Order cancelled', { variant: 'warning' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }),
  });

  const columns: GridColDef<PurchaseOrder>[] = [
    { field: 'orderNumber', headerName: 'PO Number', width: 190,
      renderCell: ({ value }) => <Typography sx={{ fontFamily: '"IBM Plex Mono"', fontSize: 12, color: 'primary.main', fontWeight: 600 }}>{value}</Typography> },
    { field: 'supplierName', headerName: 'Supplier', flex: 1, minWidth: 160 },
    { field: 'warehouseName', headerName: 'Warehouse', width: 160 },
    { field: 'status', headerName: 'Status', width: 160,
      renderCell: ({ value }) => (
        <Chip label={value.replace('_', ' ')} size="small"
          color={STATUS_COLORS[value as PurchaseOrderStatus] || 'default'} sx={{ fontSize: 11, fontWeight: 600 }} />
      )
    },
    { field: 'totalAmount', headerName: 'Total', width: 130, align: 'right', headerAlign: 'right',
      renderCell: ({ value }) => <Typography fontWeight={700} fontSize={13}>{formatCurrency(value)}</Typography> },
    { field: 'expectedDate', headerName: 'Expected', width: 120,
      renderCell: ({ value }) => value ? <Typography fontSize={12}>{formatDate(value)}</Typography> : <Typography color="text.disabled" fontSize={12}>—</Typography> },
    { field: 'createdAt', headerName: 'Created', width: 120,
      renderCell: ({ value }) => <Typography fontSize={12} color="text.secondary">{formatDate(value)}</Typography> },
    {
      field: 'actions', type: 'actions', headerName: 'Actions', width: 140,
      getActions: ({ row }) => [
        <GridActionsCellItem icon={<Visibility fontSize="small" />} label="View Details"
          onClick={() => navigate(`/purchase-orders/${row.id}`)} showInMenu />,
        ...(row.status === 'CREATED' ? [
          <GridActionsCellItem icon={<CheckCircle fontSize="small" />} label="Approve"
            onClick={() => approveMutation.mutate(row.id)} showInMenu />
        ] : []),
        ...(row.status === 'APPROVED' || row.status === 'PARTIALLY_RECEIVED' ? [
          <GridActionsCellItem icon={<LocalShipping fontSize="small" />} label="Mark Received"
            onClick={() => receiveMutation.mutate(row.id)} showInMenu />
        ] : []),
        ...(row.status !== 'RECEIVED' && row.status !== 'CANCELLED' ? [
          <GridActionsCellItem icon={<Cancel fontSize="small" />} label="Cancel"
            onClick={() => cancelMutation.mutate(row.id)} showInMenu />
        ] : []),
      ],
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Purchase Orders</Typography>
          <Typography variant="body2" color="text.secondary">{data?.totalElements ?? 0} orders total</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/purchase-orders/new')}>
          Create PO
        </Button>
      </Box>

      <Box sx={{ height: 560, bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
        <DataGrid
          rows={data?.content || []} columns={columns} loading={isLoading}
          paginationMode="server" rowCount={data?.totalElements || 0}
          paginationModel={{ page, pageSize: 20 }}
          onPaginationModelChange={m => setPage(m.page)}
          pageSizeOptions={[20]} disableRowSelectionOnClick sx={{ border: 'none' }}
        />
      </Box>
    </Box>
  );
}
