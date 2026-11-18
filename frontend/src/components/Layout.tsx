import InsightsIcon from '@mui/icons-material/Insights';
import PeopleIcon from '@mui/icons-material/People';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Insights', icon: <InsightsIcon />, end: true },
  { to: '/employees', label: 'Employees', icon: <PeopleIcon />, end: false },
];

export function Layout() {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar sx={{ gap: 3 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
            ACME · Salary Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                end={item.end}
                startIcon={item.icon}
                color="inherit"
                sx={{ '&.active': { bgcolor: 'rgba(255,255,255,0.18)' } }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            HR Manager
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
