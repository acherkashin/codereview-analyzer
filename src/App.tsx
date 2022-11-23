import { useState } from 'react';
import './App.css';
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
import { Outlet } from 'react-router-dom';
import { SideBar } from './components/SideBar';
import { AuthGuard } from './components/AuthGuard';
import { getCurrentUser, getSignOut, useAuthStore } from './stores/AuthStore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LogoutIcon from '@mui/icons-material/Logout';

export interface Credentials {
  token: string;
  host: string;
}

const DashboardNavbarRoot = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
}));

const AppFrame = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  height: '100%',
  textAlign: 'center',
}));

const Main = styled('main')(() => ({
  overflow: 'hidden',
  flexGrow: 1,
}));

function App() {
  const signOut = useAuthStore(getSignOut);
  const userCurrent = useAuthStore(getCurrentUser);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenUserMenu = (event: any) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    signOut();
    handleCloseUserMenu();
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleViewAccount = () => {
    window.open(userCurrent?.web_url ?? '', '_blank');
    handleCloseUserMenu();
  };

  return (
    <AuthGuard>
      <AppFrame className="App">
        <SideBar />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <DashboardNavbarRoot position="relative">
            <Container maxWidth="xl">
              <Toolbar disableGutters>
                <Typography variant="h6" noWrap component="div" sx={{ mr: 2, display: 'flex', flexGrow: 1 }}>
                  Analyzer
                </Typography>
                <Box sx={{ flexGrow: 0 }}>
                  <Tooltip title="Open settings">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                      <Avatar alt={userCurrent?.name} src={userCurrent?.avatar_url} />
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
                    <MenuItem onClick={handleViewAccount}>
                      <ListItemIcon>
                        <OpenInNewIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>View account</ListItemText>
                    </MenuItem>
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
          <Main>
            <Outlet />
          </Main>
        </div>
      </AppFrame>
    </AuthGuard>
  );
}

export default App;
