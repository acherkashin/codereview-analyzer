import { useState } from 'react';
import './App.css';
import { AppBar, Box, Container, IconButton, Toolbar, Typography, MenuItem, Tooltip, Avatar, Menu, styled } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { SideBar } from './components/SideBar';
import { AuthGuard } from './components/AuthGuard';
import { useAuthStore } from './stores/AuthStore';

export interface Credentials {
  token: string;
  host: string;
}

const DashboardNavbarRoot = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
}));

function App() {
  const { user, signOut } = useAuthStore();
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

  return (
    <AuthGuard>
      <div className="App" style={{ display: 'flex', flexDirection: 'row' }}>
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
                      <Avatar alt={user?.name} src={user?.avatar_url} />
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
                    {/* https://mui.com/material-ui/guides/routing/#link */}
                    <MenuItem component={RouterLink} {...{ to: '/ready-mrs' }} onMouseUp={handleCloseUserMenu}>
                      Ready Merge Request
                    </MenuItem>
                    <MenuItem component={RouterLink} {...{ to: '/charts' }} onMouseUp={handleCloseUserMenu}>
                      Charts
                    </MenuItem>
                    <MenuItem onClick={handleCloseNavMenu}>
                      <Typography textAlign="center">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </Box>
              </Toolbar>
            </Container>
          </DashboardNavbarRoot>
          <main style={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

export default App;
