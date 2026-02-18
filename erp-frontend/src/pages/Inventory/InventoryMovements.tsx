import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Chip, TextField, MenuItem, InputAdornment } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search } from '@mui/icons-material';
import { inventoryApi } from '../../api/endpoints';
import { formatDateTime } from '../../utils/format';
import type { InventoryMovement, MovementType } from '../../types';

const MOVEMENT_COLORS: Record<MovementType, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  PURCHASE: 'success', SALE: 'error', RETURN: 'warning',
  ADJUSTMENT: 'info', TRANSFER: 'default',
};

export default function InventoryMovements() {
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['movements', page],
    queryFn: () => inventoryApi.getMovements(undefined, page, 25),
  });

  const columns: GridColDef<InventoryMovement>[] = [
    { field: 'id', headerName: '#', width: 70,
      renderCell: ({ value }) => <Typography sx={{ fontFamily: '"IBM Plex Mono"', fontSize: 11, color: 'text.disabled' }}>#{value}</Typography> },
    { field: 'productSku', headerName: 'SKU', width: 130,
      renderCell: ({ value }) => <Typography sx={{ fontFamily: '"IBM Plex Mono"', fontSize: 12, color: 'primary.main' }}>{value}</Typography> },
    { field: 'productName', headerName: 'Product', flex: 1, minWidth: 180 },
    { field: 'warehouseName', headerName: 'Warehouse', width: 150 },
    { field: 'movementType', headerName: 'Type', width: 130,
      renderCell: ({ value }) => (
        <Chip label={value} size="small"
          color={MOVEMENT_COLORS[value as MovementType] || 'default'}
          sx={{ fontSize: 10, fontWeight: 700 }} />
      )
    },
    { field: 'quantity', headerName: 'Qty Change', width: 110, align: 'right', headerAlign: 'right',
      renderCell: ({ value }) => (
        <Typography fontWeight={700} fontSize={13}
          sx={{ color: value > 0 ? 'success.main' : 'error.main' }}>
          {value > 0 ? `+${value}` : value}
        </Typography>
      )
    },
    { field: 'quantityBefore', headerName: 'Before', width: 90, align: 'right', headerAlign: 'right',
      renderCell: ({ value }) => <Typography fontSize={12} color="text.secondary">{value}</Typography> },
    { field: 'quantityAfter', headerName: 'After', width: 90, align: 'right', headerAlign: 'right',
      renderCell: ({ value }) => <Typography fontSize={12} fontWeight={600}>{value}</Typography> },
    { field: 'referenceType', headerName: 'Reference', width: 130,
      renderCell: ({ value }) => value ? (
        <Chip label={value.replace('_', ' ')} size="small" variant="outlined" sx={{ fontSize: 10 }} />
      ) : <Typography color="text.disabled" fontSize={11}>—</Typography>
    },
    { field: 'notes', headerName: 'Notes', flex: 1, minWidth: 140,
      renderCell: ({ value }) => (
        <Typography fontSize={12} color="text.secondary" noWrap>{value || '—'}</Typography>
      )
    },
    { field: 'createdAt', headerName: 'Date', width: 160,
      renderCell: ({ value }) => (
        <Typography fontSize={11} sx={{ fontFamily: '"IBM Plex Mono"' }}>{formatDateTime(value)}</Typography>
      )
    },
    { field: 'createdBy', headerName: 'By', width: 100,
      renderCell: ({ value }) => <Typography fontSize={11} color="text.secondary">{value}</Typography> },
  ];

  const filtered = data?.content.filter(m => !typeFilter || m.movementType === typeFilter) || [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Inventory Movements</Typography>
        <Typography variant="body2" color="text.secondary">
          Complete audit trail of all stock changes — {data?.totalElements ?? 0} records
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField select label="Movement Type" value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)} size="small" sx={{ width: 180 }}>
          <MenuItem value="">All Types</MenuItem>
          {['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER'].map(t => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ height: 580, bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
        <DataGrid
          rows={typeFilter ? filtered : data?.content || []}
          columns={columns}
          loading={isLoading}
          paginationMode={typeFilter ? 'client' : 'server'}
          rowCount={data?.totalElements || 0}
          paginationModel={{ page, pageSize: 25 }}
          onPaginationModelChange={m => setPage(m.page)}
          pageSizeOptions={[25]}
          disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-row': { cursor: 'default' } }}
        />
      </Box>
    </Box>
  );
}
