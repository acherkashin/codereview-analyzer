import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { Gitlab } from '@gitbeaker/browser';
import { useLocalStorage } from './hooks/useLocalStorage';
import { UserSchema } from '@gitbeaker/core/dist/types/types';
import { Login } from './components/Login';
import { AppBar, Box, Container, IconButton, Toolbar, Typography, MenuItem, Tooltip, Avatar, Menu } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { AppContext } from './pages/AppContext';

export interface Credentials {
  token: string;
  host: string;
}

function App() {
  const [credentials, setCredentials] = useLocalStorage<Credentials | null>('credentials', null);
  const [user, setUser] = useState<UserSchema | null>(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const client = useMemo(() => new Gitlab(credentials), [credentials]);
  const contextValue = useMemo(() => ({ client }), [client]);

  useEffect(() => {
    client.Users.current().then((current) => {
      setUser(current);
    });
  }, [client]);

  const handleOpenUserMenu = (event: any) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setCredentials(null);
    handleCloseUserMenu();
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  if (!credentials) {
    return (
      <Login
        onLoggedIn={(token, host, user) => {
          setCredentials({
            token,
            host,
          });
          setUser(user);
        }}
      />
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="App">
        <AppBar position="static">
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
                  <MenuItem>
                    <RouterLink to="/ready-mrs">Ready Mrs</RouterLink>
                  </MenuItem>
                  <MenuItem LinkComponent={(props, ref) => <RouterLink ref={ref} to="/charts" {...props} role={undefined} />}>
                    Charts
                  </MenuItem>
                  <MenuItem onClick={handleCloseNavMenu}>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
        <Outlet />
      </div>
    </AppContext.Provider>
  );
}

export default App;
