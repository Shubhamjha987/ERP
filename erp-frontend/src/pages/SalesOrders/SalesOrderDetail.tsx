import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Button, Table, TableHead,
  TableBody, TableRow, TableCell, CircularProgress, Alert, Breadcrumbs, Link,
  Step, StepLabel, Stepper
} from '@mui/material';
import { ArrowBack, CheckCircle, LocalShipping, DoneAll, Cancel } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { salesOrderApi } from '../../api/endpoints';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import type { SalesOrderStatus } from '../../types';

const STATUS_COLORS: Record<SalesOrderStatus, 'default' | 'info' | 'warning' | 'success' | 'error' | 'primary' | 'secondary'> = {
  CREATED: 'default', CONFIRMED: 'info', PICKING: 'secondary',
  SHIPPED: 'warning', DELIVERED: 'success', CANCELLED: 'error',
};

const LIFECYCLE_STEPS = ['CREATED', 'CONFIRMED', 'PICKING', 'SHIPPED', 'DELIVERED'];

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: 1, borderColor: 'divider' }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Box>{typeof value === 'string' ? <Typography variant="body2" fontWeight={500}>{value}</Typography> : value}</Box>
  </Box>
);

export default function SalesOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: order, isLoading } = useQuery({
    queryKey: ['sales-order', id],
    queryFn: () => salesOrderApi.getById(Number(id)),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['sales-order', id] });

  const confirmMut = useMutation({ mutationFn: () => salesOrderApi.confirm(Number(id)),
    onSuccess: () => { refresh(); enqueueSnackbar('Order confirmed — inventory reserved', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }) });
  const shipMut = useMutation({ mutationFn: () => salesOrderApi.ship(Number(id)),
    onSuccess: () => { refresh(); enqueueSnackbar('Order shipped — inventory deducted', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }) });
  const deliverMut = useMutation({ mutationFn: () => salesOrderApi.deliver(Number(id)),
    onSuccess: () => { refresh(); enqueueSnackbar('Order marked as delivered', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }) });
  const cancelMut = useMutation({ mutationFn: () => salesOrderApi.cancel(Number(id)),
    onSuccess: () => { refresh(); enqueueSnackbar('Order cancelled — stock released', { variant: 'warning' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Cannot cancel', { variant: 'error' }) });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;
  if (!order) return <Alert severity="error">Order not found</Alert>;

  const currentStep = LIFECYCLE_STEPS.indexOf(order.status);

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/sales-orders" underline="hover" color="inherit">Sales Orders</Link>
        <Typography color="text.primary">{order.orderNumber}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/sales-orders')} variant="text">Back</Button>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" fontWeight={700} sx={{ fontFamily: '"IBM Plex Mono"' }}>{order.orderNumber}</Typography>
              <Chip label={order.status} color={STATUS_COLORS[order.status] || 'default'} size="small" sx={{ fontWeight: 700 }} />
            </Box>
            <Typography variant="body2" color="text.secondary">Created {formatDate(order.createdAt)}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {order.status === 'CREATED' && <Button variant="contained" startIcon={<CheckCircle />} onClick={() => confirmMut.mutate()} disabled={confirmMut.isPending}>Confirm & Reserve Stock</Button>}
          {(order.status === 'CONFIRMED' || order.status === 'PICKING') && <Button variant="contained" color="warning" startIcon={<LocalShipping />} onClick={() => shipMut.mutate()} disabled={shipMut.isPending}>Ship Order</Button>}
          {order.status === 'SHIPPED' && <Button variant="contained" color="success" startIcon={<DoneAll />} onClick={() => deliverMut.mutate()} disabled={deliverMut.isPending}>Mark Delivered</Button>}
          {order.status !== 'SHIPPED' && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
            <Button variant="outlined" color="error" startIcon={<Cancel />} onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>Cancel</Button>
          )}
        </Box>
      </Box>

      {/* Lifecycle Stepper */}
      {order.status !== 'CANCELLED' && (
        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ py: 2.5 }}>
            <Stepper activeStep={currentStep} alternativeLabel>
              {LIFECYCLE_STEPS.map(step => (
                <Step key={step} completed={currentStep > LIFECYCLE_STEPS.indexOf(step)}>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 11, fontWeight: 600 } }}>{step}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      )}

      {order.status === 'CANCELLED' && (
        <Alert severity="error" sx={{ mb: 2.5 }}>This order has been cancelled. Any reserved inventory has been released.</Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="overline" color="text.secondary" gutterBottom>Order Info</Typography>
              <InfoRow label="Customer" value={order.customerName} />
              <InfoRow label="Warehouse" value={order.warehouseName} />
              {order.requestedDate && <InfoRow label="Requested Date" value={formatDate(order.requestedDate)} />}
              {order.shippedAt && <InfoRow label="Shipped At" value={formatDateTime(order.shippedAt)} />}
              {order.deliveredAt && <InfoRow label="Delivered At" value={formatDateTime(order.deliveredAt)} />}
              {order.notes && <InfoRow label="Notes" value={order.notes} />}
              <InfoRow label="Total Amount" value={<Typography fontWeight={700} color="primary.main" fontSize={20}>{formatCurrency(order.totalAmount)}</Typography>} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="overline" color="text.secondary" gutterBottom>Order Items ({order.items?.length || 0})</Typography>
              <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Unit Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items?.map(item => (
                    <TableRow key={item.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={500}>{item.productName}</Typography>
                        <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: '"IBM Plex Mono"' }}>{item.productSku}</Typography>
                      </TableCell>
                      <TableCell align="right"><Typography fontSize={13} fontWeight={600}>{item.quantity}</Typography></TableCell>
                      <TableCell align="right"><Typography fontSize={12}>{formatCurrency(item.unitPrice)}</Typography></TableCell>
                      <TableCell align="right"><Typography fontSize={13} fontWeight={700}>{formatCurrency(item.totalPrice || 0)}</Typography></TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 700, borderTop: 2, borderColor: 'divider' }}>Total</TableCell>
                    <TableCell align="right" sx={{ borderTop: 2, borderColor: 'divider' }}>
                      <Typography fontWeight={700} fontSize={16} color="primary.main">{formatCurrency(order.totalAmount)}</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
