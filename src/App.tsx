import './App.css';
import { styled } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { SideBar } from './components/SideBar';
import { AuthGuard } from './components/AuthGuard';
import { AppHeader } from './components/AppHeader/AppHeader';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export interface Credentials {
  token: string;
  host: string;
}

const AppFrame = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  height: '100%',
}));

const Main = styled('main')(() => ({
  overflow: 'hidden',
  flexGrow: 1,
}));

export function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AuthGuard>
        <AppFrame>
          <SideBar />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <AppHeader />
            <Main>
              <Outlet />
            </Main>
          </div>
        </AppFrame>
      </AuthGuard>
    </LocalizationProvider>
  );
}
