import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    primary: { main: '#1e40af' },
    secondary: { main: '#0d9488' },
    background: { default: '#f4f6fb' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, whiteSpace: 'nowrap' } } },
  },
});

export const CHART_COLORS = { primary: '#1e40af', secondary: '#0d9488', muted: '#94a3b8', warn: '#d97706', bad: '#dc2626' };
