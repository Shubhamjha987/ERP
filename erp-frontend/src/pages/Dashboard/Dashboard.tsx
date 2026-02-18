import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Card, CardContent, Typography, Skeleton, Chip, Table,
  TableBody, TableCell, TableHead, TableRow, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, Inventory, ShoppingCart, Warning, Block } from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardApi } from '../../api/endpoints';
import { formatCurrency, formatNumber } from '../../utils/format';

const COLORS = ['#00B4D8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

const KPICard = ({ title, value, sub, icon, color, loading }: {
  title: string; value: string; sub?: string; icon: React.ReactNode; color: string; loading?: boolean;
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      {loading ? (
        <>
          <Skeleton height={20} width="60%" />
          <Skeleton height={40} width="80%" sx={{ my: 1 }} />
          <Skeleton height={16} width="40%" />
        </>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: 10 }}>{title}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color, lineHeight: 1.2, my: 0.5 }}>{value}</Typography>
              {sub && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{sub}</Typography>}
            </Box>
            <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: `${color}18`, color, display: 'flex' }}>
              {icon}
            </Box>
          </Box>
        </>
      )}
    </CardContent>
  </Card>
);

// Mock chart data (in real app comes from analytics API)
const orderTrendData = [
  { day: 'Mon', orders: 12, revenue: 14200 },
  { day: 'Tue', orders: 19, revenue: 22800 },
  { day: 'Wed', orders: 15, revenue: 17500 },
  { day: 'Thu', orders: 25, revenue: 31000 },
  { day: 'Fri', orders: 32, revenue: 38400 },
  { day: 'Sat', orders: 18, revenue: 21600 },
  { day: 'Sun', orders: 8, revenue: 9600 },
];

const stockStatusData = [
  { name: 'In Stock', value: 68 },
  { name: 'Low Stock', value: 21 },
  { name: 'Out of Stock', value: 11 },
];

export default function Dashboard() {
  const { data: invDash, isLoading: invLoading } = useQuery({
    queryKey: ['dashboard', 'inventory'],
    queryFn: dashboardApi.getInventory,
  });
  const { data: mgmtDash, isLoading: mgmtLoading } = useQuery({
    queryKey: ['dashboard', 'management'],
    queryFn: dashboardApi.getManagement,
  });

  const loading = invLoading || mgmtLoading;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Operations Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">Real-time inventory & order intelligence</Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard title="MONTHLY REVENUE" loading={loading}
            value={formatCurrency(mgmtDash?.monthlyRevenue || 0)}
            sub="Current month" icon={<TrendingUp />} color="#00B4D8" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard title="INVENTORY VALUE" loading={loading}
            value={formatCurrency(mgmtDash?.inventoryValuation || 0)}
            sub="At cost price" icon={<Inventory />} color="#10B981" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard title="LOW STOCK ALERTS" loading={loading}
            value={formatNumber(mgmtDash?.lowStockAlerts || 0)}
            sub="Items at reorder level" icon={<Warning />} color="#F59E0B" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard title="OUT OF STOCK" loading={loading}
            value={formatNumber(mgmtDash?.outOfStockAlerts || 0)}
            sub="Immediate action needed" icon={<Block />} color="#EF4444" />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Revenue Trend */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Weekly Order & Revenue Trend</Typography>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={orderTrendData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v, name) => [name === 'revenue' ? formatCurrency(+v) : v, name === 'revenue' ? 'Revenue' : 'Orders']} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#00B4D8" radius={[4,4,0,0]} name="Orders" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#10B981" radius={[4,4,0,0]} name="Revenue" opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Stock Status Pie */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Stock Status Distribution</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stockStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" paddingAngle={3}>
                    {stockStatusData.map((_, idx) => (
                      <Cell key={idx} fill={[COLORS[0], COLORS[2], COLORS[3]][idx]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {stockStatusData.map((item, idx) => (
                  <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: [COLORS[0], COLORS[2], COLORS[3]][idx], flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ flexGrow: 1, fontSize: 12 }}>{item.name}</Typography>
                    <Typography variant="body2" fontWeight={600} fontSize={12}>{item.value}%</Typography>
                    <Box sx={{ width: 60 }}>
                      <LinearProgress variant="determinate" value={item.value}
                        sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.08)',
                          '& .MuiLinearProgress-bar': { bgcolor: [COLORS[0], COLORS[2], COLORS[3]][idx] } }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Low Stock Alert Table */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Low Stock Alerts</Typography>
                <Chip label={`${invDash?.lowStockCount || 0} items`} size="small" color="warning" />
              </Box>
              {invLoading ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} height={40} sx={{ my: 0.5 }} />)
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: 11 }}>SKU</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 11 }}>Product</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 11 }}>Qty</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 11 }}>Reorder</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 11 }}>Warehouse</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(invDash?.lowStockItems || []).slice(0, 6).map((item) => (
                        <TableRow key={item.productId} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell sx={{ fontFamily: '"IBM Plex Mono"', fontSize: 11 }}>{item.sku}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{item.name}</TableCell>
                          <TableCell>
                            <Chip label={item.quantity} size="small"
                              color={item.quantity === 0 ? 'error' : 'warning'} sx={{ fontSize: 11, height: 20 }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{item.reorderLevel}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{item.warehouse}</TableCell>
                        </TableRow>
                      ))}
                      {(!invDash?.lowStockItems || invDash.lowStockItems.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                            ✅ All products have sufficient stock
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Stats */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>System Summary</Typography>
              {[
                { label: 'Total Active Products', value: formatNumber(mgmtDash?.totalActiveProducts || 0), color: '#00B4D8' },
                { label: 'Total Sales Orders', value: formatNumber(mgmtDash?.totalSalesOrders || 0), color: '#10B981' },
                { label: 'Total Purchase Orders', value: formatNumber(mgmtDash?.totalPurchaseOrders || 0), color: '#8B5CF6' },
                { label: 'Yearly Revenue', value: formatCurrency(mgmtDash?.yearlyRevenue || 0), color: '#F59E0B' },
              ].map(item => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: item.color, fontFamily: '"IBM Plex Mono"' }}>
                    {loading ? <Skeleton width={80} /> : item.value}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
