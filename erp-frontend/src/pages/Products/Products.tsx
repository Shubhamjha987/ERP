import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Typography, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { productApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/format';
import { useAppSelector } from '../../hooks/redux';
import type { Product } from '../../types';

const STATUS_COLORS = { ACTIVE: 'success', INACTIVE: 'default', DISCONTINUED: 'error' } as const;

export default function Products() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAppSelector(s => s.auth);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => search
      ? productApi.search({ name: search, page, size: 20 })
      : productApi.getAll(page, 20),
  });

  const deleteMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      enqueueSnackbar('Product deactivated', { variant: 'success' });
      setDeleteId(null);
    },
    onError: () => enqueueSnackbar('Failed to delete product', { variant: 'error' }),
  });

  const columns: GridColDef<Product>[] = [
    { field: 'sku', headerName: 'SKU', width: 130,
      renderCell: ({ value }) => (
        <Typography sx={{ fontFamily: '"IBM Plex Mono"', fontSize: 12, color: 'primary.main', fontWeight: 500 }}>
          {value}
        </Typography>
      )
    },
    { field: 'name', headerName: 'Product Name', flex: 1, minWidth: 200 },
    { field: 'categoryName', headerName: 'Category', width: 140,
      renderCell: ({ value }) => value ? (
        <Chip label={value} size="small" variant="outlined" sx={{ fontSize: 11 }} />
      ) : <Typography color="text.disabled" fontSize={12}>—</Typography>
    },
    { field: 'unitPrice', headerName: 'Unit Price', width: 120, align: 'right', headerAlign: 'right',
      renderCell: ({ value }) => (
        <Typography fontWeight={600} fontSize={13}>{formatCurrency(value)}</Typography>
      )
    },
    { field: 'costPrice', headerName: 'Cost Price', width: 120, align: 'right', headerAlign: 'right',
      renderCell: ({ value }) => (
        <Typography fontSize={12} color="text.secondary">{formatCurrency(value)}</Typography>
      )
    },
    { field: 'reorderLevel', headerName: 'Reorder Lvl', width: 110, align: 'center', headerAlign: 'center' },
    { field: 'status', headerName: 'Status', width: 110,
      renderCell: ({ value }) => (
        <Chip label={value} size="small"
          color={STATUS_COLORS[value as keyof typeof STATUS_COLORS] || 'default'}
          sx={{ fontSize: 11, fontWeight: 600 }} />
      )
    },
    ...(canEdit ? [{
      field: 'actions', type: 'actions' as const, headerName: 'Actions', width: 90,
      getActions: ({ row }: { row: Product }) => [
        <GridActionsCellItem icon={<Edit fontSize="small" />} label="Edit"
          onClick={() => navigate(`/products/${row.id}/edit`)} />,
        <GridActionsCellItem icon={<Delete fontSize="small" />} label="Delete"
          onClick={() => setDeleteId(row.id)} showInMenu />,
      ],
    }] : []),
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Products</Typography>
          <Typography variant="body2" color="text.secondary">
            {data?.totalElements ?? 0} products in catalog
          </Typography>
        </Box>
        {canEdit && (
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/products/new')}>
            Add Product
          </Button>
        )}
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField placeholder="Search by name or SKU..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          size="small" sx={{ width: 320 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.disabled', fontSize: 18 }} /></InputAdornment> }}
        />
      </Box>

      {/* DataGrid */}
      <Box sx={{ height: 560, bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden',
        border: 1, borderColor: 'divider' }}>
        <DataGrid
          rows={data?.content || []}
          columns={columns}
          loading={isLoading}
          paginationMode="server"
          rowCount={data?.totalElements || 0}
          paginationModel={{ page, pageSize: 20 }}
          onPaginationModelChange={m => setPage(m.page)}
          pageSizeOptions={[20]}
          disableRowSelectionOnClick
          sx={{ border: 'none' }}
        />
      </Box>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Deactivate Product?</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            This product will be set to INACTIVE and hidden from active listings.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error"
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            disabled={deleteMutation.isPending}>
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
