import dayjs from 'dayjs';
import { useShallow } from 'zustand/react/shallow';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloseIcon from '@mui/icons-material/Close';
import { Button, Divider, Stack, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';

import { UsersList } from '../../components';
import ExportButton from './ExportButton';

import { useChartsStore } from '../../stores/ChartsStore';
import { getEndDate, getStartDate } from '../../utils/GitUtils';

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

      {/* TODO: probably need to show confirmation dialog to prevent closing analysis if data were not exported */}
      <Tooltip title="Close Analysis">
        <Button size="small" variant="contained" onClick={closeAnalysis}>
          <CloseIcon />
        </Button>
      </Tooltip>
    </Root>
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
