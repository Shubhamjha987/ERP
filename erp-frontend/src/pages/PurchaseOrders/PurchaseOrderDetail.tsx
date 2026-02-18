import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Card, CardContent, Typography, Grid, Chip, Button, Divider,
  Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, Alert, Breadcrumbs, Link } from '@mui/material';
import { ArrowBack, CheckCircle, LocalShipping, Cancel } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { purchaseOrderApi } from '../../api/endpoints';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import type { PurchaseOrderStatus } from '../../types';

const STATUS_COLORS: Record<PurchaseOrderStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  CREATED: 'default', APPROVED: 'info', PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success', CANCELLED: 'error',
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: 1, borderColor: 'divider' }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Box sx={{ textAlign: 'right' }}>{typeof value === 'string' ? <Typography variant="body2" fontWeight={500}>{value}</Typography> : value}</Box>
  </Box>
);

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: order, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrderApi.getById(Number(id)),
  });

  const mutOpts = (msg: string, variant: 'success' | 'warning') => ({
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-order', id] }); enqueueSnackbar(msg, { variant }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Action failed', { variant: 'error' }),
  });

  const approveMut = useMutation({ mutationFn: () => purchaseOrderApi.approve(Number(id)), ...mutOpts('Order approved', 'success') });
  const receiveMut = useMutation({ mutationFn: () => purchaseOrderApi.receive(Number(id)), ...mutOpts('Inventory updated', 'success') });
  const cancelMut = useMutation({ mutationFn: () => purchaseOrderApi.cancel(Number(id)), ...mutOpts('Order cancelled', 'warning') });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;
  if (!order) return <Alert severity="error">Order not found</Alert>;

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/purchase-orders" underline="hover" color="inherit">Purchase Orders</Link>
        <Typography color="text.primary">{order.orderNumber}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/purchase-orders')} variant="text">Back</Button>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" fontWeight={700} sx={{ fontFamily: '"IBM Plex Mono"' }}>{order.orderNumber}</Typography>
              <Chip label={order.status.replace('_', ' ')} color={STATUS_COLORS[order.status]} size="small" sx={{ fontWeight: 700 }} />
            </Box>
            <Typography variant="body2" color="text.secondary">Created {formatDate(order.createdAt)}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {order.status === 'CREATED' && <Button variant="contained" startIcon={<CheckCircle />} onClick={() => approveMut.mutate()} disabled={approveMut.isPending}>Approve</Button>}
          {(order.status === 'APPROVED' || order.status === 'PARTIALLY_RECEIVED') && <Button variant="contained" color="success" startIcon={<LocalShipping />} onClick={() => receiveMut.mutate()} disabled={receiveMut.isPending}>Mark Received</Button>}
          {order.status !== 'RECEIVED' && order.status !== 'CANCELLED' && <Button variant="outlined" color="error" startIcon={<Cancel />} onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>Cancel</Button>}
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="overline" color="text.secondary" gutterBottom>Order Info</Typography>
              <InfoRow label="Supplier" value={order.supplierName} />
              <InfoRow label="Warehouse" value={order.warehouseName} />
              <InfoRow label="Expected Date" value={order.expectedDate ? formatDate(order.expectedDate) : '—'} />
              {order.receivedAt && <InfoRow label="Received At" value={formatDateTime(order.receivedAt)} />}
              {order.notes && <InfoRow label="Notes" value={order.notes} />}
              <InfoRow label="Total Amount" value={<Typography fontWeight={700} color="primary.main" fontSize={18}>{formatCurrency(order.totalAmount)}</Typography>} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="overline" color="text.secondary" gutterBottom>Order Items ({order.items?.length || 0})</Typography>
              <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Ordered</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Received</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Unit Cost</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items?.map(item => (
                    <TableRow key={item.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={500}>{item.productName}</Typography>
                        <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: '"IBM Plex Mono"' }}>{item.productSku}</Typography>
                      </TableCell>
                      <TableCell align="right"><Typography fontSize={13}>{item.quantity}</Typography></TableCell>
                      <TableCell align="right">
                        <Chip label={item.receivedQuantity} size="small"
                          color={(item.receivedQuantity || 0) >= item.quantity ? 'success' : 'default'} sx={{ fontSize: 11 }} />
                      </TableCell>
                      <TableCell align="right"><Typography fontSize={12}>{formatCurrency(item.unitCost)}</Typography></TableCell>
                      <TableCell align="right"><Typography fontSize={13} fontWeight={600}>{formatCurrency(item.totalCost || 0)}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
