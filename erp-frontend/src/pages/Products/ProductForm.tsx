import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Card, CardContent, Typography, Grid, TextField, Button,
  MenuItem, CircularProgress, Breadcrumbs, Link } from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { productApi } from '../../api/endpoints';
import type { ProductRequest, ProductStatus } from '../../types';

const STATUSES: ProductStatus[] = ['ACTIVE', 'INACTIVE', 'DISCONTINUED'];
const UOM_OPTIONS = ['EACH', 'KG', 'LITER', 'BOX', 'PACK', 'METER', 'SET'];

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: existing, isLoading: fetchLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(Number(id)),
    enabled: isEdit,
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProductRequest>({
    defaultValues: { sku: '', name: '', unitPrice: 0, costPrice: 0, reorderLevel: 10,
      reorderQuantity: 50, unitOfMeasure: 'EACH', status: 'ACTIVE' },
  });

  React.useEffect(() => {
    if (existing) {
      reset({
        sku: existing.sku, name: existing.name, description: existing.description,
        unitPrice: existing.unitPrice, costPrice: existing.costPrice,
        reorderLevel: existing.reorderLevel, reorderQuantity: existing.reorderQuantity,
        unitOfMeasure: existing.unitOfMeasure, status: existing.status,
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (data: ProductRequest) => isEdit
      ? productApi.update(Number(id), data)
      : productApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      enqueueSnackbar(`Product ${isEdit ? 'updated' : 'created'} successfully`, { variant: 'success' });
      navigate('/products');
    },
    onError: (err: any) => {
      enqueueSnackbar(err.response?.data?.message || 'Operation failed', { variant: 'error' });
    },
  });

  if (fetchLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/products" underline="hover" color="inherit">Products</Link>
        <Typography color="text.primary">{isEdit ? 'Edit Product' : 'New Product'}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/products')} variant="text">Back</Button>
        <Box>
          <Typography variant="h5" fontWeight={700}>{isEdit ? 'Edit Product' : 'Create Product'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isEdit ? `Editing: ${existing?.sku}` : 'Add a new product to the catalog'}
          </Typography>
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
            <Grid container spacing={2.5}>
              {/* Basic Info */}
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary">Basic Information</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="sku" control={control} rules={{ required: 'SKU is required', maxLength: { value: 100, message: 'Max 100 chars' } }}
                  render={({ field }) => (
                    <TextField {...field} label="SKU *" fullWidth error={!!errors.sku} helperText={errors.sku?.message}
                      disabled={isEdit} InputProps={{ style: { fontFamily: '"IBM Plex Mono"' } }} />
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="name" control={control} rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="Product Name *" fullWidth error={!!errors.name} helperText={errors.name?.message} />
                  )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="description" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Description" fullWidth multiline rows={2} />
                  )} />
              </Grid>

              {/* Pricing */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Typography variant="overline" color="text.secondary">Pricing</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="unitPrice" control={control}
                  rules={{ required: 'Unit price required', min: { value: 0, message: 'Must be ≥ 0' } }}
                  render={({ field }) => (
                    <TextField {...field} label="Unit Price (Selling) *" type="number" fullWidth
                      inputProps={{ step: '0.01', min: 0 }}
                      error={!!errors.unitPrice} helperText={errors.unitPrice?.message} />
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="costPrice" control={control}
                  rules={{ required: 'Cost price required', min: { value: 0, message: 'Must be ≥ 0' } }}
                  render={({ field }) => (
                    <TextField {...field} label="Cost Price (Purchase) *" type="number" fullWidth
                      inputProps={{ step: '0.01', min: 0 }}
                      error={!!errors.costPrice} helperText={errors.costPrice?.message} />
                  )} />
              </Grid>

              {/* Inventory Settings */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Typography variant="overline" color="text.secondary">Inventory Settings</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Controller name="reorderLevel" control={control}
                  rules={{ min: { value: 0, message: 'Must be ≥ 0' } }}
                  render={({ field }) => (
                    <TextField {...field} label="Reorder Level" type="number" fullWidth
                      inputProps={{ min: 0 }} error={!!errors.reorderLevel} helperText={errors.reorderLevel?.message} />
                  )} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Controller name="reorderQuantity" control={control}
                  rules={{ min: { value: 0, message: 'Must be ≥ 0' } }}
                  render={({ field }) => (
                    <TextField {...field} label="Reorder Qty" type="number" fullWidth
                      inputProps={{ min: 0 }} />
                  )} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Controller name="unitOfMeasure" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Unit of Measure" select fullWidth>
                      {UOM_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Controller name="status" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Status" select fullWidth>
                      {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>

              {/* Actions */}
              <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
                <Button variant="outlined" onClick={() => navigate('/products')}>Cancel</Button>
                <Button type="submit" variant="contained" startIcon={<Save />}
                  disabled={mutation.isPending}>
                  {mutation.isPending ? <CircularProgress size={18} /> : (isEdit ? 'Save Changes' : 'Create Product')}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
