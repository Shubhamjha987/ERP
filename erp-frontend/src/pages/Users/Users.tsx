import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Typography, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, MenuItem, Avatar, Alert
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add, PersonOff, PersonAdd } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { authApi } from '../../api/endpoints';
import { formatDateTime } from '../../utils/format';
import apiClient from '../../api/client';
import type { User, RegisterRequest, UserRole } from '../../types';

const ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'STAFF'];
const ROLE_COLORS = { ADMIN: 'error', MANAGER: 'warning', STAFF: 'info' } as const;

export default function Users() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users').then(r => r.data.data || r.data),
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<RegisterRequest>({
    defaultValues: { username: '', email: '', password: '', firstName: '', lastName: '', role: 'STAFF' },
  });

  const createMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User created successfully', { variant: 'success' });
      setModalOpen(false);
      reset();
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.message || 'Failed to create user', { variant: 'error' }),
  });

  const columns: GridColDef<User>[] = [
    { field: 'username', headerName: 'Username', width: 160,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 30, height: 30, fontSize: 13, fontWeight: 700,
            bgcolor: ROLE_COLORS[row.role] === 'error' ? 'error.main' : ROLE_COLORS[row.role] === 'warning' ? 'warning.main' : 'info.main' }}>
            {row.username.charAt(0).toUpperCase()}
          </Avatar>
          <Typography fontSize={13} fontWeight={500} sx={{ fontFamily: '"IBM Plex Mono"' }}>{row.username}</Typography>
        </Box>
      )
    },
    { field: 'firstName', headerName: 'Name', width: 180,
      renderCell: ({ row }) => (
        <Typography fontSize={13}>{[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}</Typography>
      )
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200,
      renderCell: ({ value }) => <Typography fontSize={12} color="primary.main">{value}</Typography> },
    { field: 'role', headerName: 'Role', width: 110,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={ROLE_COLORS[value as UserRole] || 'default'} sx={{ fontWeight: 700, fontSize: 11 }} />
      )
    },
    { field: 'enabled', headerName: 'Status', width: 100,
      renderCell: ({ value }) => (
        <Chip label={value ? 'Active' : 'Disabled'} size="small" color={value ? 'success' : 'default'} sx={{ fontSize: 11 }} />
      )
    },
    { field: 'lastLogin', headerName: 'Last Login', width: 170,
      renderCell: ({ value }) => (
        <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: '"IBM Plex Mono"' }}>
          {value ? formatDateTime(value) : 'Never'}
        </Typography>
      )
    },
    { field: 'createdAt', headerName: 'Created', width: 130,
      renderCell: ({ value }) => <Typography fontSize={11} color="text.secondary">{formatDateTime(value)}</Typography> },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>User Management</Typography>
          <Typography variant="body2" color="text.secondary">{users?.length ?? 0} users — Admin access only</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { reset(); setModalOpen(true); }}>
          Create User
        </Button>
      </Box>

      <Alert severity="warning" sx={{ mb: 2.5 }}>
        <strong>Admin Only:</strong> All user management actions are logged and audited.
        Only ADMIN role can access this page and create/modify users.
      </Alert>

      <Box sx={{ height: 520, bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
        <DataGrid
          rows={users || []} columns={columns} loading={isLoading}
          pageSizeOptions={[25]} disableRowSelectionOnClick sx={{ border: 'none' }}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        />
      </Box>

      {/* Create User Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller name="username" control={control} rules={{ required: 'Username required', minLength: { value: 3, message: 'Min 3 characters' } }}
                  render={({ field }) => <TextField {...field} label="Username *" fullWidth error={!!errors.username} helperText={errors.username?.message} />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="role" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Role" fullWidth>
                      {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="email" control={control} rules={{ required: 'Email required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } }}
                  render={({ field }) => <TextField {...field} label="Email *" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="firstName" control={control}
                  render={({ field }) => <TextField {...field} label="First Name" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="lastName" control={control}
                  render={({ field }) => <TextField {...field} label="Last Name" fullWidth />} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="password" control={control}
                  rules={{ required: 'Password required', minLength: { value: 8, message: 'Min 8 characters' },
                    pattern: { value: /(?=.*[A-Z])(?=.*[0-9])/, message: 'Must include uppercase and number' } }}
                  render={({ field }) => <TextField {...field} label="Password *" type="password" fullWidth error={!!errors.password} helperText={errors.password?.message || 'Min 8 chars, 1 uppercase, 1 number'} />} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(d => createMutation.mutate(d))} disabled={createMutation.isPending}>
            Create User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
