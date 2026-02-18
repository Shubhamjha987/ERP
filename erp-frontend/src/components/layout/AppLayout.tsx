import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Typography, Avatar, Tooltip, Divider,
  Badge, Collapse, useTheme, alpha, Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart, LocalShipping, People, BarChart, SupervisedUserCircle,
  Menu as MenuIcon, DarkMode, LightMode, Logout, ExpandLess, ExpandMore,
  Category, Warehouse, History, Notifications, Settings
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout, toggleDarkMode } from '../../redux/store';

const SIDEBAR_WIDTH = 256;
const SIDEBAR_COLLAPSED = 64;

interface NavItem {
  label: string; icon: React.ReactNode; path?: string;
  children?: { label: string; icon: React.ReactNode; path: string }[];
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Products', icon: <Category />, path: '/products' },
  {
    label: 'Inventory', icon: <InventoryIcon />,
    children: [
      { label: 'Stock Levels', icon: <Warehouse />, path: '/inventory' },
      { label: 'Movements', icon: <History />, path: '/inventory/movements' },
    ]
  },
  { label: 'Purchase Orders', icon: <ShoppingCart />, path: '/purchase-orders', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Sales Orders', icon: <LocalShipping />, path: '/sales-orders' },
  { label: 'Suppliers', icon: <People />, path: '/suppliers' },
  { label: 'Analytics', icon: <BarChart />, path: '/analytics', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Users', icon: <SupervisedUserCircle />, path: '/users', roles: ['ADMIN'] },
];

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user } = useAppSelector(s => s.auth);
  const { darkMode } = useAppSelector(s => s.ui);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Inventory']);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const isActive = (path?: string) => path && location.pathname === path;
  const isChildActive = (children?: NavItem['children']) =>
    children?.some(c => location.pathname.startsWith(c.path));

  const canAccess = (roles?: string[]) => !roles || !user || roles.includes(user.role);

  const isDark = theme.palette.mode === 'dark';
  const sidebarBg = isDark ? '#0D1B2A' : '#0F1B2D';
  const sidebarText = '#C8D8E8';
  const sidebarActiveText = '#FFFFFF';
  const sidebarActiveBg = 'rgba(0, 180, 216, 0.18)';
  const sidebarHoverBg = 'rgba(255,255,255,0.06)';

  const NavListItem = ({ item, nested = false }: { item: NavItem; nested?: boolean }) => {
    if (!canAccess(item.roles)) return null;
    const hasChildren = !!item.children;
    const expanded = expandedItems.includes(item.label);
    const active = isActive(item.path) || isChildActive(item.children);

    return (
      <>
        <ListItemButton
          onClick={() => {
            if (hasChildren) { toggleExpanded(item.label); if (!sidebarOpen) setSidebarOpen(true); }
            else if (item.path) navigate(item.path);
          }}
          sx={{
            mx: 1, mb: 0.5, borderRadius: 2, pl: nested ? 4 : 1.5,
            pr: 1.5, minHeight: 44,
            backgroundColor: active ? sidebarActiveBg : 'transparent',
            '&:hover': { backgroundColor: active ? sidebarActiveBg : sidebarHoverBg },
            transition: 'all 0.15s',
          }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: active ? '#00B4D8' : sidebarText }}>
            {item.icon}
          </ListItemIcon>
          {sidebarOpen && (
            <>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: 13.5, fontWeight: active ? 600 : 400,
                  color: active ? sidebarActiveText : sidebarText,
                }}
              />
              {hasChildren && (expanded ? <ExpandLess sx={{ color: sidebarText, fontSize: 18 }} /> : <ExpandMore sx={{ color: sidebarText, fontSize: 18 }} />)}
            </>
          )}
        </ListItemButton>
        {hasChildren && sidebarOpen && (
          <Collapse in={expanded}>
            <List disablePadding>
              {item.children!.map(child => (
                <NavListItem key={child.path} item={child} nested />
              ))}
            </List>
          </Collapse>
        )}
      </>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ---- SIDEBAR ---- */}
      <Drawer
        variant="permanent"
        sx={{
          width: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
          flexShrink: 0,
          transition: 'width 0.2s ease',
          '& .MuiDrawer-paper': {
            width: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
            boxSizing: 'border-box',
            background: sidebarBg,
            borderRight: 'none',
            overflow: 'hidden',
            transition: 'width 0.2s ease',
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 2.5, gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #00B4D8, #0096B4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <InventoryIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          {sidebarOpen && (
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                EnterpriseERP
              </Typography>
              <Typography sx={{ color: '#64A6C8', fontSize: 10.5, fontFamily: '"IBM Plex Mono"', letterSpacing: '0.08em' }}>
                INVENTORY & ORDERS
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

        {/* Nav Items */}
        <List sx={{ px: 0.5, py: 1.5, flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {NAV_ITEMS.map(item => <NavListItem key={item.label} item={item} />)}
        </List>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

        {/* User Footer */}
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#00B4D8', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          {sidebarOpen && (
            <Box flexGrow={1} minWidth={0}>
              <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 500, lineHeight: 1.3 }} noWrap>
                {user?.username}
              </Typography>
              <Chip
                label={user?.role}
                size="small"
                sx={{ height: 16, fontSize: 9.5, fontFamily: '"IBM Plex Mono"', letterSpacing: '0.05em',
                  bgcolor: 'rgba(0,180,216,0.2)', color: '#00B4D8', fontWeight: 600 }}
              />
            </Box>
          )}
          {sidebarOpen && (
            <Tooltip title="Logout">
              <IconButton size="small" onClick={() => dispatch(logout())} sx={{ color: sidebarText }}>
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Drawer>

      {/* ---- MAIN AREA ---- */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        {/* Top AppBar */}
        <AppBar position="static" elevation={0} sx={{
          bgcolor: 'background.paper',
          borderBottom: 1, borderColor: 'divider', zIndex: 1,
        }}>
          <Toolbar sx={{ gap: 1, minHeight: '56px !important' }}>
            <IconButton size="small" onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ color: 'text.secondary' }}>
              <MenuIcon />
            </IconButton>

            {/* Breadcrumb */}
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, fontSize: 15 }}>
              {NAV_ITEMS.flatMap(i => [i, ...(i.children || [])]).find(i => i.path && location.pathname === i.path)?.label || 'ERP System'}
            </Typography>

            <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              <IconButton size="small" onClick={() => dispatch(toggleDarkMode())} sx={{ color: 'text.secondary' }}>
                {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <Badge badgeContent={3} color="error"><Notifications fontSize="small" /></Badge>
              </IconButton>
            </Tooltip>

            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 12, cursor: 'pointer' }}>
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: 'background.default' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
