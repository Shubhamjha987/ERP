import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress, Chip
} from '@mui/material';
import { Visibility, VisibilityOff, Inventory } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useAppDispatch } from '../../hooks/redux';
import { setCredentials } from '../../redux/store';
import { authApi } from '../../api/endpoints';
import type { LoginRequest } from '../../types';

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(data);
      dispatch(setCredentials({ username: res.username, role: res.role, token: res.accessToken }));
      enqueueSnackbar(`Welcome back, ${res.username}!`, { variant: 'success' });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid username or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    const creds: Record<string, { username: string; password: string }> = {
      admin: { username: 'admin', password: 'Admin@123' },
      manager: { username: 'manager', password: 'Manager@123' },
      staff: { username: 'staff', password: 'Staff@123' },
    };
    setValue('username', creds[role].username);
    setValue('password', creds[role].password);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F1B2D 0%, #162236 40%, #0D2847 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decorative elements */}
      {[...Array(6)].map((_, i) => (
        <Box key={i} sx={{
          position: 'absolute',
          width: 300 + i * 100, height: 300 + i * 100,
          borderRadius: '50%',
          border: '1px solid rgba(0,180,216,0.06)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: `pulse ${4 + i}s ease-in-out infinite`,
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.3 }, '50%': { opacity: 0.08 }
          },
        }} />
      ))}

      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, px: 2 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: '18px',
            background: 'linear-gradient(135deg, #00B4D8, #0096B4)',
            boxShadow: '0 8px 32px rgba(0,180,216,0.4)', mb: 2,
          }}>
            <Inventory sx={{ color: '#fff', fontSize: 32 }} />
          </Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em' }}>
            EnterpriseERP
          </Typography>
          <Typography sx={{ color: '#64A6C8', fontSize: 12, fontFamily: '"IBM Plex Mono"', letterSpacing: '0.15em', mt: 0.5 }}>
            INVENTORY & ORDER MANAGEMENT
          </Typography>
        </Box>

        <Card sx={{
          background: 'rgba(22, 34, 54, 0.95)',
          border: '1px solid rgba(0,180,216,0.15)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography sx={{ color: '#E2E8F0', fontWeight: 600, fontSize: 18, mb: 0.5 }}>
              Sign in to your account
            </Typography>
            <Typography sx={{ color: '#64A6C8', fontSize: 13, mb: 3 }}>
              Access your ERP dashboard
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Username"
                fullWidth
                {...register('username', { required: 'Username is required' })}
                error={!!errors.username}
                helperText={errors.username?.message}
                sx={{ '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.05)', color: '#E2E8F0' },
                  '& .MuiInputLabel-root': { color: '#64A6C8' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,180,216,0.2)' } }}
              />
              <TextField
                label="Password"
                type={showPwd ? 'text' : 'password'}
                fullWidth
                {...register('password', { required: 'Password is required' })}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPwd(!showPwd)} sx={{ color: '#64A6C8' }}>
                        {showPwd ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.05)', color: '#E2E8F0' },
                  '& .MuiInputLabel-root': { color: '#64A6C8' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,180,216,0.2)' } }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading}
                sx={{
                  py: 1.5, mt: 1, fontSize: 15,
                  background: 'linear-gradient(135deg, #00B4D8, #0096B4)',
                  boxShadow: '0 4px 16px rgba(0,180,216,0.4)',
                  '&:hover': { boxShadow: '0 6px 20px rgba(0,180,216,0.6)' },
                }}>
                {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Sign In'}
              </Button>
            </Box>

            {/* Quick Demo Login */}
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography sx={{ color: '#64A6C8', fontSize: 11, fontFamily: '"IBM Plex Mono"', letterSpacing: '0.1em', mb: 1.5, textAlign: 'center' }}>
                DEMO ACCOUNTS
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                {['admin', 'manager', 'staff'].map(role => (
                  <Chip key={role} label={role} onClick={() => fillDemo(role)} clickable
                    sx={{ bgcolor: 'rgba(0,180,216,0.1)', color: '#00B4D8', border: '1px solid rgba(0,180,216,0.2)',
                      fontWeight: 600, fontSize: 11, fontFamily: '"IBM Plex Mono"', letterSpacing: '0.05em',
                      '&:hover': { bgcolor: 'rgba(0,180,216,0.2)' } }} />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
