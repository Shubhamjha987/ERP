import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Typography, Chip, Tooltip } from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add, Visibility, CheckCircle, LocalShipping, DoneAll, Cancel } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { salesOrderApi } from '../../api/endpoints';
import { formatCurrency, formatDate } from '../../utils/format';
import type { SalesOrder, SalesOrderStatus } from '../../types';

const STATUS_COLORS: Record<SalesOrderStatus, 'default' | 'info' | 'warning' | 'success' | 'error' | 'primary' | 'secondary'> = {
  CREATED: 'default', CONFIRMED: 'info', PICKING: 'secondary',
  SHIPPED: 'warning', DELIVERED: 'success', CANCELLED: 'error',
};

export default function SalesOrders() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['sales-orders', page],
    queryFn: () => salesOrderApi.getAll(page, 20),
  });

  const mutOpts = (msg: string) => ({
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-orders'] }); enqueueSnackbar(msg, { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Action failed', { variant: 'error' }),
  });

  const confirmMut = useMutation({ mutationFn: salesOrderApi.confirm, ...mutOpts('Order confirmed & inventory reserved') });
  const shipMut = useMutation({ mutationFn: salesOrderApi.ship, ...mutOpts('Order shipped & inventory deducted') });
  const deliverMut = useMutation({ mutationFn: salesOrderApi.deliver, ...mutOpts('Order delivered') });
  const cancelMut = useMutation({
    mutationFn: salesOrderApi.cancel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-orders'] }); enqueueSnackbar('Order cancelled & reservation released', { variant: 'warning' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Cannot cancel', { variant: 'error' }),
  });

  const columns: GridColDef<SalesOrder>[] = [
    { field: 'orderNumber', headerName: 'SO Number', width: 200,
      renderCell: ({ value }) => <Typography sx={{ fontFamily: '"IBM Plex Mono"', fontSize: 12, color: 'primary.main', fontWeight: 600 }}>{value}</Typography> },
    { field: 'customerName', headerName: 'Customer', flex: 1, minWidth: 160 },
    { field: 'warehouseName', headerName: 'Warehouse', width: 150 },
    { field: 'status', headerName: 'Status', width: 130,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={STATUS_COLORS[value as SalesOrderStatus] || 'default'} sx={{ fontSize: 11, fontWeight: 600 }} />
      )
    },
    { field: 'totalAmount', headerName: 'Total', width: 130, align: 'right', headerAlign: 'right',
      renderCell: ({ value }) => <Typography fontWeight={700} fontSize={13}>{formatCurrency(value)}</Typography> },
    { field: 'requestedDate', headerName: 'Requested', width: 120,
      renderCell: ({ value }) => value ? <Typography fontSize={12}>{formatDate(value)}</Typography> : <Typography color="text.disabled" fontSize={12}>—</Typography> },
    { field: 'createdAt', headerName: 'Created', width: 120,
      renderCell: ({ value }) => <Typography fontSize={12} color="text.secondary">{formatDate(value)}</Typography> },
    {
      field: 'actions', type: 'actions', headerName: '', width: 60,
      getActions: ({ row }) => [
        <GridActionsCellItem icon={<Visibility fontSize="small" />} label="View Details"
          onClick={() => navigate(`/sales-orders/${row.id}`)} showInMenu />,
        ...(row.status === 'CREATED' ? [
          <GridActionsCellItem icon={<CheckCircle fontSize="small" />} label="Confirm & Reserve Stock"
            onClick={() => confirmMut.mutate(row.id)} showInMenu />
        ] : []),
        ...(row.status === 'CONFIRMED' || row.status === 'PICKING' ? [
          <GridActionsCellItem icon={<LocalShipping fontSize="small" />} label="Ship Order"
            onClick={() => shipMut.mutate(row.id)} showInMenu />
        ] : []),
        ...(row.status === 'SHIPPED' ? [
          <GridActionsCellItem icon={<DoneAll fontSize="small" />} label="Mark Delivered"
            onClick={() => deliverMut.mutate(row.id)} showInMenu />
        ] : []),
        ...(row.status !== 'SHIPPED' && row.status !== 'DELIVERED' && row.status !== 'CANCELLED' ? [
          <GridActionsCellItem icon={<Cancel fontSize="small" />} label="Cancel Order"
            onClick={() => cancelMut.mutate(row.id)} showInMenu />
        ] : []),
      ],
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Sales Orders</Typography>
          <Typography variant="body2" color="text.secondary">{data?.totalElements ?? 0} orders — manage entire fulfilment lifecycle</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/sales-orders/new')}>
          New Order
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
