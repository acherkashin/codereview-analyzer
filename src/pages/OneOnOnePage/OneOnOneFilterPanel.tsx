import { useState } from 'react';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useShallow } from 'zustand/react/shallow';
import { UsersList } from '../../components';
import { useChartsStore } from '../../stores/ChartsStore';
import { getEndDate, getStartDate } from '../../utils/GitUtils';

export function OneOnOneFilterPanel() {
  const minDate = useChartsStore((state) => dayjs(getStartDate(state.pullRequests ?? [])));
  const maxDate = useChartsStore((state) => dayjs(getEndDate(state.pullRequests ?? [])));

  const { user, users, startDate, endDate, setStartDate, setEndDate, closeAnalysis, setUser } = useChartsStore(
    useShallow((state) => ({
      user: state.user,
      users: state.users,
      startDate: state.startDate,
      endDate: state.endDate,
      setStartDate: state.actions.setStartDate,
      setEndDate: state.actions.setEndDate,
      closeAnalysis: state.actions.closeAnalysis,
      setUser: state.actions.setUser,
    }))
  );

  const [open, setOpen] = useState(false);

  return (
    <Root data-testid="analysis-filter-panel" direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <DatePicker
        label="Created After"
        format="DD/MM/YYYY"
        value={startDate}
        minDate={minDate}
        maxDate={maxDate}
        onChange={setStartDate}
        slotProps={{ textField: { sx: { width: { xs: '100%', sm: 'auto' } } } }}
      />
      <DatePicker
        label="Created Before"
        format="DD/MM/YYYY"
        value={endDate}
        minDate={startDate || undefined}
        maxDate={maxDate}
        onChange={setEndDate}
        slotProps={{ textField: { sx: { width: { xs: '100%', sm: 'auto' } } } }}
      />

      <Divider aria-hidden="true" orientation="vertical" variant="middle" sx={{ display: { xs: 'none', sm: 'block' } }} />

      <UsersList label="Team member" user={user} users={users} onSelected={setUser} />

      <Tooltip title="Close Analysis">
        <Button size="small" variant="contained" sx={{ marginLeft: 'auto' }} onClick={() => setOpen(true)}>
          <CloseIcon />
        </Button>
      </Tooltip>

      <ConfirmationDialog
        open={open}
        onClose={(confirmed) => {
          setOpen(false);

          if (confirmed) {
            closeAnalysis();
          }
        }}
      />
    </Root>
  );
}

function ConfirmationDialog({ open, onClose }: { open: boolean; onClose: (confirmed: boolean) => void }) {
  return (
    <Dialog open={open} onClose={() => onClose(false)} aria-labelledby="close-analysis-title">
      <DialogTitle id="close-analysis-title">Close Analysis?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You are about to close the current analysis. Use the same project and date filters again if you want to reopen it.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onClose(false)}>
          Go Back
        </Button>
        <Button onClick={() => onClose(true)} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const Root = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
  position: 'sticky',
  top: theme.spacing(1),
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(21,26,36,.94)' : 'rgba(255,255,255,.94)',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.palette.mode === 'dark' ? '0 10px 24px rgba(0,0,0,.18)' : '0 8px 22px rgba(32,39,64,.05)',
  backdropFilter: 'blur(14px)',
  zIndex: 2,
  flexWrap: 'wrap',
  [theme.breakpoints.down('sm')]: {
    position: 'static',
    flexWrap: 'nowrap',
  },
}));
