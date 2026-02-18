import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Grid, Card, CardContent, Skeleton } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { dashboardApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/format';

const COLORS = ['#00B4D8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

// Mock chart data (supplement with real API data where available)
const revenueTrendData = [
  { month: 'Aug', revenue: 82000, orders: 145 },
  { month: 'Sep', revenue: 95000, orders: 168 },
  { month: 'Oct', revenue: 88000, orders: 152 },
  { month: 'Nov', revenue: 112000, orders: 198 },
  { month: 'Dec', revenue: 134000, orders: 234 },
  { month: 'Jan', revenue: 98000, orders: 174 },
  { month: 'Feb', revenue: 121000, orders: 216 },
];

const categoryStockData = [
  { category: 'Electronics', quantity: 1240, value: 186000 },
  { category: 'Office Supplies', quantity: 3820, value: 42000 },
  { category: 'Furniture', quantity: 310, value: 93000 },
  { category: 'Software', quantity: 890, value: 67000 },
];

const orderStatusData = [
  { name: 'Delivered', value: 45 },
  { name: 'Shipped', value: 20 },
  { name: 'Confirmed', value: 18 },
  { name: 'Created', value: 12 },
  { name: 'Cancelled', value: 5 },
];

const supplierPerfData = [
  { supplier: 'TechParts', deliveryDays: 4.2, orders: 34, onTime: 92 },
  { supplier: 'GlobalSupply', deliveryDays: 6.8, orders: 28, onTime: 78 },
  { supplier: 'FastLogix', deliveryDays: 2.1, orders: 18, onTime: 97 },
  { supplier: 'MegaWholesale', deliveryDays: 9.5, orders: 12, onTime: 65 },
];

const radarData = [
  { metric: 'On-Time', TechParts: 92, GlobalSupply: 78, FastLogix: 97, MegaWholesale: 65 },
  { metric: 'Quality', TechParts: 88, GlobalSupply: 82, FastLogix: 90, MegaWholesale: 72 },
  { metric: 'Price', TechParts: 75, GlobalSupply: 90, FastLogix: 65, MegaWholesale: 88 },
  { metric: 'Volume', TechParts: 85, GlobalSupply: 70, FastLogix: 50, MegaWholesale: 60 },
  { metric: 'Support', TechParts: 78, GlobalSupply: 85, FastLogix: 88, MegaWholesale: 70 },
];

const ChartCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      <Box sx={{ mt: 2 }}>{children}</Box>
    </CardContent>
  </Card>
);

export default function Analytics() {
  const { data: invDash, isLoading } = useQuery({
    queryKey: ['dashboard', 'inventory'], queryFn: dashboardApi.getInventory,
  });
  const { data: mgmt } = useQuery({ queryKey: ['dashboard', 'management'], queryFn: dashboardApi.getManagement });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Analytics</Typography>
        <Typography variant="body2" color="text.secondary">Business intelligence & performance insights</Typography>
      </Box>

      {/* Revenue & Orders Trend */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12}>
          <ChartCard title="Revenue & Order Trend" subtitle="Last 7 months performance">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, name) => [name === 'revenue' ? formatCurrency(+v) : v, name === 'revenue' ? 'Revenue' : 'Orders']} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#00B4D8" strokeWidth={3} dot={{ r: 5, fill: '#00B4D8' }} name="revenue" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="orders" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Stock & Order Status Row */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={7}>
          <ChartCard title="Inventory by Category" subtitle="Stock quantity and estimated value">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryStockData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="quantity" fill="#00B4D8" name="Qty" radius={[4,4,0,0]} />
                <Bar yAxisId="right" dataKey="value" fill="#8B5CF6" name="Value ($)" radius={[4,4,0,0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={5}>
          <ChartCard title="Order Status Distribution" subtitle="Current status breakdown">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={orderStatusData} cx="45%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" paddingAngle={3} label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false} fontSize={10}>
                  {orderStatusData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Supplier Performance */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Supplier Performance" subtitle="Avg delivery days & on-time rate">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={supplierPerfData} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="supplier" tick={{ fontSize: 11 }} width={85} />
                <Tooltip />
                <Legend />
                <Bar dataKey="deliveryDays" fill="#F59E0B" name="Avg Delivery (days)" radius={[0,4,4,0]} />
                <Bar dataKey="onTime" fill="#10B981" name="On-Time %" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Supplier Comparison Radar" subtitle="Multi-dimensional supplier evaluation">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <Radar name="TechParts" dataKey="TechParts" stroke="#00B4D8" fill="#00B4D8" fillOpacity={0.2} />
                <Radar name="GlobalSupply" dataKey="GlobalSupply" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                <Radar name="FastLogix" dataKey="FastLogix" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}
