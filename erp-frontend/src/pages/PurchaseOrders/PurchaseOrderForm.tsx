import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, MenuItem,
  IconButton, Table, TableHead, TableBody, TableRow, TableCell,
  Breadcrumbs, Link, Alert, Divider, CircularProgress
} from '@mui/material';
import { Add, Delete, ArrowBack, Save } from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { purchaseOrderApi, supplierApi, warehouseApi, productApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/format';
import type { PurchaseOrderRequest } from '../../types';

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: suppliers } = useQuery({ queryKey: ['suppliers-all'], queryFn: () => supplierApi.getAll(0, 100) });
  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: warehouseApi.getAll });
  const { data: products } = useQuery({ queryKey: ['products-all'], queryFn: () => productApi.getAll(0, 200) });

  const { control, handleSubmit, watch, formState: { errors } } = useForm<PurchaseOrderRequest>({
    defaultValues: { supplierId: 0, warehouseId: 0, notes: '', items: [{ productId: 0, quantity: 1, unitCost: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const total = watchedItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0), 0);

  const mutation = useMutation({
    mutationFn: purchaseOrderApi.create,
    onSuccess: (po) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      enqueueSnackbar(`Purchase order ${po.orderNumber} created`, { variant: 'success' });
      navigate('/purchase-orders');
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Failed to create PO', { variant: 'error' }),
  });

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/purchase-orders" underline="hover" color="inherit">Purchase Orders</Link>
        <Typography color="text.primary">New PO</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/purchase-orders')} variant="text">Back</Button>
        <Box>
          <Typography variant="h5" fontWeight={700}>Create Purchase Order</Typography>
          <Typography variant="body2" color="text.secondary">Order stock from a supplier</Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary" gutterBottom>Order Details</Typography>
            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <Controller name="supplierId" control={control} rules={{ required: true, min: 1 }}
                  render={({ field }) => (
                    <TextField {...field} select label="Supplier *" fullWidth error={!!errors.supplierId}>
                      {suppliers?.content.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="warehouseId" control={control} rules={{ required: true, min: 1 }}
                  render={({ field }) => (
                    <TextField {...field} select label="Destination Warehouse *" fullWidth error={!!errors.warehouseId}>
                      {warehouses?.content.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="expectedDate" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Expected Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
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
              <Button size="small" startIcon={<Add />}
                onClick={() => append({ productId: 0, quantity: 1, unitCost: 0 })}>
                Add Item
              </Button>
            </Box>

            {fields.length === 0 && (
              <Alert severity="info">Add at least one product to the order.</Alert>
            )}

            <Table size="small">
              {fields.length > 0 && (
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} width={120}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} width={140}>Unit Cost</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} width={120} align="right">Total</TableCell>
                    <TableCell width={50} />
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {fields.map((field, idx) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Controller name={`items.${idx}.productId`} control={control} rules={{ required: true, min: 1 }}
                        render={({ field }) => (
                          <TextField {...field} select size="small" fullWidth placeholder="Select product">
                            {products?.content.map(p => (
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
                      <Controller name={`items.${idx}.unitCost`} control={control} rules={{ required: true, min: 0.01 }}
                        render={({ field }) => (
                          <TextField {...field} type="number" size="small" fullWidth inputProps={{ min: 0, step: 0.01 }} />
                        )} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} fontSize={13}>
                        {formatCurrency((watchedItems[idx]?.quantity || 0) * (watchedItems[idx]?.unitCost || 0))}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => remove(idx)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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
          <Button variant="outlined" onClick={() => navigate('/purchase-orders')}>Cancel</Button>
          <Button type="submit" variant="contained" startIcon={<Save />}
            disabled={mutation.isPending || fields.length === 0}>
            {mutation.isPending ? <CircularProgress size={18} /> : 'Submit Purchase Order'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
