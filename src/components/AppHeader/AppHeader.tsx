import { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Typography,
  MenuItem,
  Tooltip,
  Avatar,
  Menu,
  styled,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Logo } from '../Logo';
import { getCurrentUser, getSignOut, useAuthStore } from './../../stores/AuthStore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LogoutIcon from '@mui/icons-material/Logout';
import { useIsGuest } from '../../hooks/useIsGuest';
import { useLocation, useNavigate } from 'react-router-dom';

const DashboardNavbarRoot = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
}));

export function AppHeader() {
  const isGuest = useIsGuest();
  const signOut = useAuthStore(getSignOut);
  const userCurrent = useAuthStore(getCurrentUser);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleOpenUserMenu = (event: any) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    signOut();
    handleCloseUserMenu();
    navigate('/login');
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleViewAccount = () => {
    window.open(userCurrent?.webUrl ?? '', '_blank');
    handleCloseUserMenu();
  };

  return (
    <DashboardNavbarRoot position="relative">
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 3 } }}>
        <Toolbar disableGutters>
          <Box sx={{ display: 'flex', flexShrink: 0, '& img': { width: { xs: 40, sm: 50 } } }}>
            <Logo />
          </Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              color: 'text.primary',
              ml: 2,
              display: { xs: 'none', md: 'flex' },
              flexGrow: 1,
            }}
          >
            Analyzer
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 1 }, ml: 'auto', mr: { xs: 1, sm: 2 } }}>
            {[
              { label: 'Charts', href: '/charts' },
              { label: '1:1 Review', href: '/one-on-one' },
              { label: 'Team Review', href: '/team-review' },
            ].map((item) => (
              <Button
                key={item.href}
                color={location.pathname === item.href ? 'primary' : 'inherit'}
                variant={location.pathname === item.href ? 'contained' : 'text'}
                sx={{
                  minWidth: { xs: 0, sm: 64 },
                  px: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  color: location.pathname === item.href ? undefined : 'text.primary',
                  backgroundColor: location.pathname === item.href ? undefined : 'transparent',
                  '&:hover': {
                    backgroundColor: location.pathname === item.href ? undefined : 'action.hover',
                  },
                }}
                onClick={() => navigate(item.href)}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              {/* TODO: need to show guest icon */}
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={userCurrent?.fullName} src={userCurrent?.avatarUrl} />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {!isGuest && (
                <MenuItem onClick={handleViewAccount}>
                  <ListItemIcon>
                    <OpenInNewIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>View account</ListItemText>
                </MenuItem>
              )}
              <MenuItem onClick={handleCloseNavMenu}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </DashboardNavbarRoot>
  );
}
