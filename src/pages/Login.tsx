import {
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
import { useCallback, useEffect, useState } from 'react';
import { ReactComponent as GitLabIcon } from './../components/gitlab.svg';
import { ReactComponent as GiteaIcon } from './../components/gitea.svg';
import { TooltipPrompt } from '../components';
import { HostingType, getIsAuthenticated, useAuthStore } from '../stores/AuthStore';
import { useNavigate } from 'react-router-dom';
import { LoadingButton } from '@mui/lab';
import { getCredentials } from '../utils/CredentialUtils';
import { Logo } from '../components/Logo';

export interface LoginProps {}

export function Login(_: LoginProps) {
  const navigate = useNavigate();
  const [hostType, setHostType] = useState<HostingType>('Gitlab');
  const [token, setToken] = useState('');
  const [host, setHost] = useState('');
  //TODO: upgrade zustand and use shallowEquals
  const { signIn, isSigningIn } = useAuthStore();
  const isAuthenticated = useAuthStore(getIsAuthenticated);

  //TODO: need to call client.Users.current() to make sure token and host are correct

  const handleLoggedIn = useCallback(() => {
    signIn(host, token, hostType).then(
      () => {
        navigate('/personal');
      },
      (e) => {
        console.error(e);
        //TODO: need to show validation
      }
    );
  }, [host, hostType, navigate, signIn, token]);

  //TODO: refactor, it is duplicated with AuthGuard
  useEffect(() => {
    if (!isAuthenticated) {
      const credentials = getCredentials();
      if (credentials) {
        signIn(credentials.host, credentials.token, credentials.hostType);
        navigate('/personal');
        return;
      }
      console.log('Not authenticated, redirecting');
      navigate('/login');
    }
  }, [isAuthenticated, navigate, signIn]);

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
          onChange={(e) => setToken(e.target.value)}
          InputProps={{
            endAdornment: (
              <TooltipPrompt>
                <a
                  href="https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html#create-a-personal-access-token"
                  target="_blank"
                  rel="noreferrer"
                >
                  Personal Access Token
                </a>
              </TooltipPrompt>
            ),
          }}
        />
        <LoadingButton loading={isSigningIn} onClick={handleLoggedIn}>
          Sign In
        </LoadingButton>
      </Stack>
    </Box>
  );
}
