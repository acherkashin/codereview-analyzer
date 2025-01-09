import {
  Button,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Box } from '@mui/system';
import { useCallback, useState } from 'react';
import GitLabIcon from './../components/gitlab.svg?react';
import GiteaIcon from './../components/gitea.svg?react';
import { TooltipPrompt } from '../components';
import { getSignIn, getSignInGuest, useAuthStore } from '../stores/AuthStore';
import { useNavigate } from 'react-router-dom';
import { LoadingButton } from '@mui/lab';
import { Logo } from '../components/Logo';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { HostingType } from '../services/types';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import { isValidHttpUrl } from '../utils/UrlUtils';

const tokenHelp: Record<HostingType, `https://${string}`> = {
  Gitlab: 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html#create-a-personal-access-token',
  Gitea: 'https://docs.gitea.com/development/api-usage',
};

export interface LoginProps {}

export function Login(_: LoginProps) {
  const navigate = useNavigate();
  const [hostType, setHostType] = useState<HostingType>('Gitlab');
  const [token, setToken] = useState('');
  const [host, setHost] = useState('');

  const [isHostValid, setIsHostValid] = useState(true);

  const signIn = useAuthStore(getSignIn);
  const signInGuest = useAuthStore(getSignInGuest);
  const cancelSignIn = useAuthStore((state) => state.actions.cancelSignIn);
  const isSigningIn = useAuthStore((state) => state.isSigningIn);
  const signInError = useAuthStore((state) => state.signInError);

  const handleLoginAsGuest = () => {
    signInGuest();
    navigate('/charts');
  };

  //TODO: need to call client.Users.current() to make sure token and host are correct

  const handleLoggedIn = useCallback(() => {
    if (!isValidHttpUrl(host)) {
      setIsHostValid(false);
      return;
    }
    setIsHostValid(true);

    signIn(host, token, hostType).then(() => {
      navigate('/charts');
    });
  }, [host, hostType, navigate, signIn, token]);

  // redirects to login if not authenticated
  useAuthGuard();

  const handleChange = (event: SelectChangeEvent<string>) => {
    setHostType(event.target.value as HostingType);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
      <Stack style={{ width: 500 }} spacing={2}>
        <Stack alignItems={'center'} spacing={2}>
          <Logo />
          <Typography variant="h5" component="h1">
            Code Review Analyzer
          </Typography>
        </Stack>
        <Select required value={hostType} onChange={handleChange} style={{ height: 56 }}>
          <MenuItem value="Gitlab">
            <ListItem>
              <ListItemIcon>
                <GitLabIcon style={{ width: 24 }} />
              </ListItemIcon>
              <ListItemText>Gitlab</ListItemText>
            </ListItem>
          </MenuItem>
          <MenuItem value="Gitea">
            <ListItem>
              <ListItemIcon>
                <GiteaIcon style={{ width: 24 }} />
              </ListItemIcon>
              <ListItemText>Gitea</ListItemText>
            </ListItem>
          </MenuItem>
        </Select>
        <TextField
          required
          error={!isHostValid}
          helperText={isHostValid ? null : 'Incorrect url provided'}
          label="Host"
          name="host"
          placeholder="https://gitlab.com"
          value={host}
          onChange={(e) => setHost(e.target.value)}
        />
        <TextField
          required
          label="Token"
          name="token"
          value={token}
          type="password"
          error={!!signInError}
          helperText={signInError}
          onChange={(e) => setToken(e.target.value)}
          InputProps={{
            endAdornment:
              tokenHelp[hostType] != null ? (
                <TooltipPrompt>
                  <a href={tokenHelp[hostType]} target="_blank" rel="noreferrer">
                    Personal Access Token
                  </a>
                </TooltipPrompt>
              ) : null,
          }}
        />
        <LoadingButton loading={isSigningIn} startIcon={<LoginIcon />} onClick={handleLoggedIn}>
          Login
        </LoadingButton>
        {isSigningIn && <Button onClick={cancelSignIn}>Cancel</Button>}
        <Button onClick={handleLoginAsGuest} startIcon={<PersonIcon />}>
          Login As Guest
        </Button>
      </Stack>
    </Box>
  );
}
