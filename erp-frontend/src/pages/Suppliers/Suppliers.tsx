import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Typography, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, MenuItem, Card, CardContent, Avatar
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add, Edit, Business } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { supplierApi } from '../../api/endpoints';
import { useAppSelector } from '../../hooks/redux';
import type { Supplier, SupplierRequest, SupplierStatus } from '../../types';

const STATUS_COLORS = { ACTIVE: 'success', INACTIVE: 'default', BLACKLISTED: 'error' } as const;
const STATUSES: SupplierStatus[] = ['ACTIVE', 'INACTIVE', 'BLACKLISTED'];

export default function Suppliers() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAppSelector(s => s.auth);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page],
    queryFn: () => supplierApi.getAll(page, 20),
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<SupplierRequest>({
    defaultValues: { name: '', contactName: '', email: '', phone: '', address: '', city: '', country: '', paymentTerms: 30, leadTime: 7, status: 'ACTIVE' },
  });

  const openCreate = () => { setEditingSupplier(null); reset({ name: '', contactName: '', email: '', phone: '', paymentTerms: 30, leadTime: 7, status: 'ACTIVE' }); setModalOpen(true); };
  const openEdit = (s: Supplier) => { setEditingSupplier(s); reset({ name: s.name, contactName: s.contactName, email: s.email, phone: s.phone, address: s.address, city: s.city, country: s.country, paymentTerms: s.paymentTerms, leadTime: s.leadTime, status: s.status }); setModalOpen(true); };

  const saveMutation = useMutation({
    mutationFn: (data: SupplierRequest) => editingSupplier ? supplierApi.update(editingSupplier.id, data) : supplierApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      enqueueSnackbar(`Supplier ${editingSupplier ? 'updated' : 'created'}`, { variant: 'success' });
      setModalOpen(false);
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Operation failed', { variant: 'error' }),
  });

  const columns: GridColDef<Supplier>[] = [
    { field: 'name', headerName: 'Supplier Name', flex: 1, minWidth: 200,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 12, flexShrink: 0 }}>
            {row.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography fontSize={13} fontWeight={500}>{row.name}</Typography>
            {row.contactName && <Typography fontSize={11} color="text.secondary">{row.contactName}</Typography>}
          </Box>
        </Box>
      )
    },
    { field: 'email', headerName: 'Email', width: 220,
      renderCell: ({ value }) => <Typography fontSize={12} color="primary.main">{value || '—'}</Typography> },
    { field: 'phone', headerName: 'Phone', width: 140,
      renderCell: ({ value }) => <Typography fontSize={12}>{value || '—'}</Typography> },
    { field: 'city', headerName: 'Location', width: 160,
      renderCell: ({ row }) => <Typography fontSize={12}>{[row.city, row.country].filter(Boolean).join(', ') || '—'}</Typography> },
    { field: 'paymentTerms', headerName: 'Payment Terms', width: 140, align: 'center', headerAlign: 'center',
      renderCell: ({ value }) => <Chip label={`${value} days`} size="small" variant="outlined" sx={{ fontSize: 11 }} /> },
    { field: 'leadTime', headerName: 'Lead Time', width: 120, align: 'center', headerAlign: 'center',
      renderCell: ({ value }) => <Typography fontSize={12}>{value} days</Typography> },
    { field: 'status', headerName: 'Status', width: 110,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={STATUS_COLORS[value as SupplierStatus] || 'default'} sx={{ fontSize: 11, fontWeight: 600 }} />
      )
    },
    ...(canEdit ? [{
      field: 'actions', type: 'actions' as const, headerName: '', width: 60,
      getActions: ({ row }: { row: Supplier }) => [
        <GridActionsCellItem icon={<Edit fontSize="small" />} label="Edit" onClick={() => openEdit(row)} />,
      ],
    }] : []),
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Suppliers</Typography>
          <Typography variant="body2" color="text.secondary">{data?.totalElements ?? 0} suppliers registered</Typography>
        </Box>
        {canEdit && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Supplier</Button>}
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

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller name="name" control={control} rules={{ required: 'Name required' }}
                  render={({ field }) => <TextField {...field} label="Company Name *" fullWidth error={!!errors.name} helperText={errors.name?.message} />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="contactName" control={control}
                  render={({ field }) => <TextField {...field} label="Contact Person" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="email" control={control}
                  render={({ field }) => <TextField {...field} label="Email" fullWidth type="email" />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="phone" control={control}
                  render={({ field }) => <TextField {...field} label="Phone" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="city" control={control}
                  render={({ field }) => <TextField {...field} label="City" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="country" control={control}
                  render={({ field }) => <TextField {...field} label="Country" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="paymentTerms" control={control}
                  render={({ field }) => <TextField {...field} label="Payment Terms (days)" type="number" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="leadTime" control={control}
                  render={({ field }) => <TextField {...field} label="Lead Time (days)" type="number" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="status" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Status" fullWidth>
                      {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="address" control={control}
                  render={({ field }) => <TextField {...field} label="Address" fullWidth multiline rows={2} />} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(d => saveMutation.mutate(d))} disabled={saveMutation.isPending}>
            {editingSupplier ? 'Save Changes' : 'Create Supplier'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
