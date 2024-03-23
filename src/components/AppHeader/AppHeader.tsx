import { useState } from 'react';
import {
  AppBar,
  Box,
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
import { useNavigate } from 'react-router-dom';

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
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Logo />
          <Typography color="text.primary" variant="h6" noWrap component="div" sx={{ ml: 2, display: 'flex', flexGrow: 1 }}>
            Analyzer
          </Typography>
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
