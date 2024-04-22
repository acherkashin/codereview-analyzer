import dayjs from 'dayjs';
import { useShallow } from 'zustand/react/shallow';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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

import { UsersList } from '../../components';
import ExportButton from './ExportButton';

import { useChartsStore } from '../../stores/ChartsStore';
import { getEndDate, getStartDate } from '../../utils/GitUtils';
import { useState } from 'react';

/**
 * Filters pull requests by user and date range
 */
export function CodeReviewFilterPanel() {
  const minDate = useChartsStore((state) => dayjs(getStartDate(state.pullRequests)));
  const maxDate = useChartsStore((state) => dayjs(getEndDate(state.pullRequests)));

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

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (confirmed: boolean) => {
    setOpen(false);

    if (confirmed) {
      closeAnalysis();
    }
  };

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

      <UsersList label="Users" user={user} users={users} onSelected={setUser} />

      <ExportButton style={{ marginLeft: 'auto' }} />

      <Tooltip title="Close Analysis">
        <Button size="small" variant="contained" onClick={handleClickOpen}>
          <CloseIcon />
        </Button>
      </Tooltip>
      <ConfirmationDialog open={open} onClose={handleClose} />
    </Root>
  );
}

interface ConfirmationDialogProps {
  open: boolean;
  onClose: (confirmed: boolean) => void;
}

function ConfirmationDialog({ open, onClose }: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
      <DialogTitle id="alert-dialog-title">{'Close Analysis?'}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          You are are about to close analysis. Export you data if you don't want to lose them. Do you really want to close it?
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
  // inputs labels are cut on the top, so we need to add some padding
  paddingTop: 6,
  position: 'sticky',
  top: 0,
  backgroundColor: theme.palette.background.default,
  zIndex: 1,
}));
