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
    <Root direction="row" spacing={2}>
      <DatePicker
        label="Created After"
        format="DD/MM/YYYY"
        value={startDate}
        minDate={minDate}
        maxDate={maxDate}
        onChange={setStartDate}
      />
      <DatePicker
        label="Created Before"
        format="DD/MM/YYYY"
        value={endDate}
        minDate={startDate || undefined}
        maxDate={maxDate}
        onChange={setEndDate}
      />

      <Divider aria-hidden="true" orientation="vertical" variant="middle" />

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
  paddingTop: 6,
  position: 'sticky',
  top: 0,
  backgroundColor: theme.palette.background.default,
  zIndex: 1,
  flexWrap: 'wrap',
}));
