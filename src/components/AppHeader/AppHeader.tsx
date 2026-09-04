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
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import { Logo } from '../Logo';
import { getCurrentUser, getSignOut, useAuthStore } from './../../stores/AuthStore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LogoutIcon from '@mui/icons-material/Logout';
import { useIsGuest } from '../../hooks/useIsGuest';
import { useLocation, useNavigate } from 'react-router-dom';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import { ColorModePreference, useColorMode } from '../../theme/ColorModeProvider';
import { ColorModeToggle } from '../ColorModeToggle';

const DashboardNavbarRoot = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(21,26,36,.88)' : 'rgba(255,255,255,.88)',
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  backdropFilter: 'blur(16px)',
}));

export function AppHeader() {
  const isGuest = useIsGuest();
  const signOut = useAuthStore(getSignOut);
  const userCurrent = useAuthStore(getCurrentUser);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { preference, setPreference } = useColorMode();

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
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 3 } }}>
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, sm: 72 } }}>
          <Box sx={{ display: 'flex', flexShrink: 0, alignItems: 'center' }}>
            <Logo size={40} />
          </Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              color: 'text.primary',
              ml: 1.5,
              display: { xs: 'none', md: 'flex' },
              flexGrow: 1,
              fontWeight: 750,
              letterSpacing: '-0.02em',
            }}
          >
            Analyzer
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 1 }, ml: 'auto', mr: { xs: 1, sm: 2 } }}>
            {[
              { label: 'Charts', shortLabel: 'Charts', href: '/charts' },
              { label: '1:1 Review', shortLabel: '1:1', href: '/one-on-one' },
              { label: 'Team Review', shortLabel: 'Team', href: '/team-review' },
            ].map((item) => (
              <Button
                key={item.href}
                aria-label={item.label}
                color={location.pathname === item.href ? 'primary' : 'inherit'}
                variant="text"
                sx={{
                  minWidth: { xs: 0, sm: 64 },
                  px: { xs: 0.75, sm: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  color: location.pathname === item.href ? undefined : 'text.primary',
                  borderRadius: 2,
                  backgroundColor: location.pathname === item.href ? 'action.selected' : 'transparent',
                  fontWeight: location.pathname === item.href ? 700 : 600,
                  '&:hover': {
                    backgroundColor: location.pathname === item.href ? 'action.selected' : 'action.hover',
                  },
                }}
                onClick={() => navigate(item.href)}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {item.label}
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  {item.shortLabel}
                </Box>
              </Button>
            ))}
          </Box>
          <Box sx={{ display: 'flex', flexGrow: 0, alignItems: 'center', gap: 0.25 }}>
            <ColorModeToggle />
            <Tooltip title="Open settings">
              {/* TODO: need to show guest icon */}
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={userCurrent?.fullName} src={userCurrent?.avatarUrl} />
              </IconButton>
            </Tooltip>
            <Menu
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
              <Box sx={{ px: 1.5, pt: 1, pb: 1.5 }}>
                <Typography variant="overline" color="text.secondary">
                  Appearance
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size="small"
                  value={preference}
                  onChange={(_, value: ColorModePreference | null) => value && setPreference(value)}
                  aria-label="Color mode"
                  sx={{ mt: 0.5 }}
                >
                  <ToggleButton value="light" aria-label="Light theme">
                    <LightModeOutlinedIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="system" aria-label="System theme">
                    <SettingsBrightnessOutlinedIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="dark" aria-label="Dark theme">
                    <DarkModeOutlinedIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Divider />
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
