import { createTheme, alpha } from '@mui/material/styles';

// ---- DESIGN TOKENS ----
const PALETTE = {
  navy: '#0F1B2D',
  navyLight: '#162236',
  navyBorder: '#1E2D44',
  accent: '#00B4D8',     // electric cyan
  accentDark: '#0096B4',
  amber: '#F59E0B',
  green: '#10B981',
  red: '#EF4444',
  orange: '#F97316',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',
};

export const lightTheme = createTheme({
  typography: {
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, letterSpacing: '0.02em' },
    overline: { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 500, letterSpacing: '0.1em' },
  },
  palette: {
    mode: 'light',
    primary: { main: PALETTE.accent, dark: PALETTE.accentDark, contrastText: '#fff' },
    secondary: { main: PALETTE.amber },
    success: { main: PALETTE.green },
    error: { main: PALETTE.red },
    warning: { main: PALETTE.orange },
    background: { default: PALETTE.slate100, paper: '#FFFFFF' },
    text: { primary: PALETTE.slate900, secondary: PALETTE.slate500 },
    divider: PALETTE.slate200,
  },
  shape: { borderRadius: 8 },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.05)',
    '0 1px 4px rgba(0,0,0,0.08)',
    '0 2px 8px rgba(0,0,0,0.08)',
    '0 4px 16px rgba(0,0,0,0.08)',
    '0 8px 24px rgba(0,0,0,0.1)',
    ...Array(19).fill('none'),
  ] as any,
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 6, textTransform: 'none', fontWeight: 600, padding: '8px 18px' },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: `0 4px 12px ${alpha(PALETTE.accent, 0.4)}` },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${PALETTE.slate200}` },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: { border: 'none', '& .MuiDataGrid-columnHeader': { backgroundColor: PALETTE.slate100, fontWeight: 600 } },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 6 } },
    },
  },
});

export const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    mode: 'dark',
    primary: { main: PALETTE.accent, dark: PALETTE.accentDark, contrastText: '#fff' },
    secondary: { main: PALETTE.amber },
    success: { main: PALETTE.green },
    error: { main: PALETTE.red },
    warning: { main: PALETTE.orange },
    background: { default: '#0A1628', paper: PALETTE.navyLight },
    text: { primary: '#E2E8F0', secondary: '#94A3B8' },
    divider: PALETTE.navyBorder,
  },
  components: {
    ...lightTheme.components,
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.3)', border: `1px solid ${PALETTE.navyBorder}`, backgroundColor: PALETTE.navyLight },
      },
    },
  },
});

export { PALETTE };
