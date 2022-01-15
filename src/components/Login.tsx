import { Button, Stack, TextField, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useCallback, useState } from 'react';
import { ReactComponent as GitLabIcon } from './gitlab.svg';
import { Gitlab } from '@gitbeaker/browser';
import { UserSchema } from '@gitbeaker/core/dist/types/types';

export interface LoginProps {
  onLoggedIn: (token: string, host: string, user: UserSchema) => void;
}

export function Login({ onLoggedIn }: LoginProps) {
  const [token, setToken] = useState('');
  const [host, setHost] = useState('');

  //TODO: need to call client.Users.current() to make sure token and host are correct

  const handleLoggedIn = useCallback(() => {
    //TODO: replace when start using react-router
    const client = new Gitlab({
      token,
      host,
    });

    client.Users.current()
      .then((user) => {
        onLoggedIn(token, host, user);
      })
      .catch((ex) => {
        console.log(ex);
      });
  }, [host, onLoggedIn, token]);

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
        />
        <Button onClick={handleLoggedIn}>Sing In</Button>
      </Stack>
    </Box>
  );
}
