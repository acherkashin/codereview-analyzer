import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import {
  Autocomplete,
  Avatar,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Tooltip,
  createFilterOptions,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useShallow } from 'zustand/react/shallow';
import { User } from '../../services/types';
import { UserListItem } from '../../components/UsersList/UserListItem';
import { useChartsStore } from '../../stores/ChartsStore';
import { getEndDate, getStartDate } from '../../utils/GitUtils';

export function TeamReviewFilterPanel() {
  const minDate = useChartsStore((state) => dayjs(getStartDate(state.pullRequests ?? [])));
  const maxDate = useChartsStore((state) => dayjs(getEndDate(state.pullRequests ?? [])));

  const {
    teamUsers,
    users,
    showOutsideTeamMembers,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    closeAnalysis,
    setTeamUsers,
    setShowOutsideTeamMembers,
  } = useChartsStore(
    useShallow((state) => ({
      teamUsers: state.teamUsers,
      users: state.users ?? [],
      showOutsideTeamMembers: state.showOutsideTeamMembers,
      startDate: state.startDate,
      endDate: state.endDate,
      setStartDate: state.actions.setStartDate,
      setEndDate: state.actions.setEndDate,
      closeAnalysis: state.actions.closeAnalysis,
      setTeamUsers: state.actions.setTeamUsers,
      setShowOutsideTeamMembers: state.actions.setShowOutsideTeamMembers,
    }))
  );

  const [open, setOpen] = useState(false);
  const filterOptions = useMemo(
    () =>
      createFilterOptions<User>({
        ignoreCase: true,
        stringify: (user) => `${user.displayName} ${user.fullName} ${user.userName}`,
      }),
    []
  );

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

      <Autocomplete
        multiple
        disableCloseOnSelect
        options={users}
        value={teamUsers}
        filterOptions={filterOptions}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionLabel={(option) => option.displayName}
        onChange={(_, value) => setTeamUsers(value)}
        renderValue={(value, getItemProps) =>
          value.map((option, index) => (
            <Chip
              {...getItemProps({ index })}
              key={option.id}
              avatar={<Avatar src={option.avatarUrl} alt={option.displayName} />}
              label={option.displayName}
              size="small"
            />
          ))
        }
        renderOption={({ key, ...props }, user, { selected }) => (
          <UserListItem key={key} user={user} selected={selected} {...props} />
        )}
        renderInput={(params) => <TextField {...params} label="Team members" placeholder="Select members" />}
        sx={{ minWidth: { xs: '100%', sm: 420 }, flexGrow: 1 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={showOutsideTeamMembers}
            onChange={(_, checked) => setShowOutsideTeamMembers(checked)}
            slotProps={{
              input: { 'aria-label': 'Show outside team' },
            }}
          />
        }
        label="Show outside team"
        sx={{ ml: { xs: 0, sm: 1 }, whiteSpace: 'nowrap' }}
      />

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
    <Dialog open={open} onClose={() => onClose(false)} aria-labelledby="close-team-analysis-title">
      <DialogTitle id="close-team-analysis-title">Close Analysis?</DialogTitle>
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
  [theme.breakpoints.down('sm')]: {
    position: 'static',
    flexWrap: 'nowrap',
  },
}));
