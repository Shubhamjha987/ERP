import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, MenuItem,
  IconButton, Table, TableHead, TableBody, TableRow, TableCell,
  Breadcrumbs, Link, CircularProgress, Alert
} from '@mui/material';
import { Add, Delete, ArrowBack, Save } from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { salesOrderApi, customerApi, warehouseApi, productApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/format';
import type { SalesOrderRequest } from '../../types';

export default function SalesOrderForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: customers } = useQuery({ queryKey: ['customers-all'], queryFn: () => customerApi.getAll(0, 100) });
  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: warehouseApi.getAll });
  const { data: products } = useQuery({ queryKey: ['products-all'], queryFn: () => productApi.getAll(0, 200) });

  const { control, handleSubmit, watch, formState: { errors } } = useForm<SalesOrderRequest>({
    defaultValues: { customerId: 0, warehouseId: 0, notes: '', items: [{ productId: 0, quantity: 1, unitPrice: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const total = watchedItems.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);

  const productMap = React.useMemo(() =>
    Object.fromEntries((products?.content || []).map(p => [p.id, p])), [products]);

  const onProductChange = (idx: number, productId: number) => {
    const p = productMap[productId];
    if (p) {
      // Auto-fill unit price from product's selling price
    }
  };

  const mutation = useMutation({
    mutationFn: salesOrderApi.create,
    onSuccess: (so) => {
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
      enqueueSnackbar(`Sales order ${so.orderNumber} created`, { variant: 'success' });
      navigate('/sales-orders');
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Failed to create order', { variant: 'error' }),
  });

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/sales-orders" underline="hover" color="inherit">Sales Orders</Link>
        <Typography color="text.primary">New Sales Order</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/sales-orders')} variant="text">Back</Button>
        <Box>
          <Typography variant="h5" fontWeight={700}>Create Sales Order</Typography>
          <Typography variant="body2" color="text.secondary">Stock is reserved when you confirm the order</Typography>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2.5 }}>
        <strong>Inventory reservation:</strong> Stock will be reserved when you <em>confirm</em> the order.
        Inventory is only deducted when the order is shipped.
      </Alert>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary" gutterBottom>Order Details</Typography>
            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <Controller name="customerId" control={control} rules={{ required: true, min: 1 }}
                  render={({ field }) => (
                    <TextField {...field} select label="Customer *" fullWidth error={!!errors.customerId}>
                      {customers?.content.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="warehouseId" control={control} rules={{ required: true, min: 1 }}
                  render={({ field }) => (
                    <TextField {...field} select label="Ship from Warehouse *" fullWidth error={!!errors.warehouseId}>
                      {warehouses?.content.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="requestedDate" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Requested Delivery Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="notes" control={control}
                  render={({ field }) => <TextField {...field} label="Notes" fullWidth />} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="overline" color="text.secondary">Order Items</Typography>
              <Button size="small" startIcon={<Add />} onClick={() => append({ productId: 0, quantity: 1, unitPrice: 0 })}>
                Add Item
              </Button>
            </Box>

            <Table size="small">
              {fields.length > 0 && (
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} width={110}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} width={140}>Unit Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} width={120} align="right">Subtotal</TableCell>
                    <TableCell width={50} />
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {fields.map((field, idx) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Controller name={`items.${idx}.productId`} control={control} rules={{ required: true, min: 1 }}
                        render={({ field: f }) => (
                          <TextField {...f} select size="small" fullWidth
                            onChange={e => { f.onChange(e); onProductChange(idx, +e.target.value); }}>
                            {products?.content.filter(p => p.status === 'ACTIVE').map(p => (
                              <MenuItem key={p.id} value={p.id}>{p.name} ({p.sku})</MenuItem>
                            ))}
                          </TextField>
                        )} />
                    </TableCell>
                    <TableCell>
                      <Controller name={`items.${idx}.quantity`} control={control} rules={{ required: true, min: 1 }}
                        render={({ field }) => (
                          <TextField {...field} type="number" size="small" fullWidth inputProps={{ min: 1 }} />
                        )} />
                    </TableCell>
                    <TableCell>
                      <Controller name={`items.${idx}.unitPrice`} control={control} rules={{ required: true, min: 0.01 }}
                        render={({ field }) => (
                          <TextField {...field} type="number" size="small" fullWidth inputProps={{ min: 0, step: 0.01 }} />
                        )} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} fontSize={13}>
                        {formatCurrency((watchedItems[idx]?.quantity || 0) * (watchedItems[idx]?.unitPrice || 0))}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => remove(idx)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {fields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Alert severity="info" variant="outlined" sx={{ my: 1 }}>Add at least one product to the order.</Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {fields.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="overline" color="text.secondary">Order Total</Typography>
                  <Typography variant="h5" fontWeight={700} color="primary.main">{formatCurrency(total)}</Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate('/sales-orders')}>Cancel</Button>
          <Button type="submit" variant="contained" startIcon={<Save />}
            disabled={mutation.isPending || fields.length === 0}>
            {mutation.isPending ? <CircularProgress size={18} /> : 'Create Sales Order'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
