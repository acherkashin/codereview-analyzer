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
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
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
