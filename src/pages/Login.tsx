import { Stack, TextField, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useCallback, useState } from 'react';
import { ReactComponent as GitLabIcon } from './../components/gitlab.svg';
import { TooltipPrompt } from '../components';
import { useAuthStore } from '../stores/AuthStore';
import { useNavigate } from 'react-router-dom';
import { LoadingButton } from '@mui/lab';

export interface LoginProps {}

export function Login(_: LoginProps) {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [host, setHost] = useState('');
  const { signIn, isSigningIn } = useAuthStore();

  //TODO: need to call client.Users.current() to make sure token and host are correct

  const handleLoggedIn = useCallback(() => {
    signIn(host, token).then(
      () => {
        navigate('/personal');
      },
      (e) => {
        console.error(e);
        //TODO: need to show validation
      }
    );
  }, [host, navigate, signIn, token]);

  return (
    <Box style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Stack style={{ width: 500 }} spacing={2}>
        <GitLabIcon style={{ width: 150, alignSelf: 'center' }} />
        <Typography variant="h5" component="h1" alignSelf={'center'}>
          GitLab Code Review Analyzer
        </Typography>
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
