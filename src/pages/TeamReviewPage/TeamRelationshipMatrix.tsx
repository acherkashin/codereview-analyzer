import { ComponentProps, useMemo } from 'react';
import {
  Avatar,
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha, Theme } from '@mui/material/styles';
import { User } from '../../services/types';
import { TeamReviewModel, TeamReviewRelationship, getRelationshipId } from '../../utils/TeamReviewUtils';

export type RelationshipMatrixMetric = 'reviewedPullRequestsCount' | 'approvalsCount' | 'discussionsStartedCount';

export interface TeamRelationshipMatrixProps {
  model: TeamReviewModel;
  metric: RelationshipMatrixMetric;
  selectedRelationshipId?: string | null;
  onMetricChange: (metric: RelationshipMatrixMetric) => void;
  onRelationshipSelect: (relationshipId: string) => void;
}

interface MatrixAuthorColumn {
  user: User;
  isSelectedTeamMember: boolean;
}

const metricOptions: Array<{ value: RelationshipMatrixMetric; label: string; ariaLabel: string }> = [
  { value: 'reviewedPullRequestsCount', label: 'PR reviews', ariaLabel: 'Use PR reviews as heatmap metric' },
  { value: 'approvalsCount', label: 'Approvals', ariaLabel: 'Use approvals as heatmap metric' },
  { value: 'discussionsStartedCount', label: 'Discussions started', ariaLabel: 'Use discussions started as heatmap metric' },
];

export function TeamRelationshipMatrix({
  model,
  metric,
  selectedRelationshipId,
  onMetricChange,
  onRelationshipSelect,
}: TeamRelationshipMatrixProps) {
  const relationshipsById = useMemo(() => {
    return new Map(model.relationships.map((relationship) => [relationship.id, relationship]));
  }, [model.relationships]);

  const columns = useMemo(() => {
    const selectedAuthorColumns: MatrixAuthorColumn[] = model.selectedTeamMembers.map((user) => ({
      user,
      isSelectedTeamMember: true,
    }));
    const outsideAuthorsById = new Map<string, User>();

    model.relationships.forEach((relationship) => {
      if (!relationship.isAuthorSelectedTeamMember) {
        outsideAuthorsById.set(relationship.author.id, relationship.author);
      }
    });

    const outsideAuthorColumns = [...outsideAuthorsById.values()]
      .sort((left, right) => left.displayName.localeCompare(right.displayName))
      .map((user): MatrixAuthorColumn => ({ user, isSelectedTeamMember: false }));

    return [...selectedAuthorColumns, ...outsideAuthorColumns];
  }, [model.relationships, model.selectedTeamMembers]);

  const maxMetricValue = useMemo(() => {
    return model.selectedTeamMembers.reduce((maxValue, reviewer) => {
      return columns.reduce((rowMaxValue, column) => {
        const relationship = relationshipsById.get(getRelationshipId(reviewer.id, column.user.id));

        if (!relationship) {
          return rowMaxValue;
        }

        return Math.max(rowMaxValue, relationship[metric]);
      }, maxValue);
    }, 0);
  }, [columns, metric, model.selectedTeamMembers, relationshipsById]);

  const currentMetricLabel = metricOptions.find((option) => option.value === metric)?.label ?? 'Metric';

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          value={metric}
          exclusive
          size="small"
          aria-label="Relationship matrix heatmap metric"
          onChange={(_, value: RelationshipMatrixMetric | null) => {
            if (value) {
              onMetricChange(value);
            }
          }}
          sx={{ maxWidth: '100%', overflowX: 'auto', '& .MuiToggleButton-root': { whiteSpace: 'nowrap' } }}
        >
          {metricOptions.map((option) => (
            <ToggleButton key={option.value} value={option.value} aria-label={option.ariaLabel}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <HeatmapLegend label={currentMetricLabel} />
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
        Scroll horizontally to compare authors. Reviewer names stay pinned on the left.
      </Typography>

      <Box
        role="region"
        aria-label="Scrollable reviewer to author matrix"
        tabIndex={0}
        sx={{ overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, maxHeight: 620 }}
      >
        <Table
          stickyHeader
          size="small"
          aria-label="Reviewer to author relationship matrix"
          sx={{
            minWidth: Math.max(520, 184 + columns.length * 136),
            tableLayout: 'fixed',
            '& .MuiTableCell-root': { borderColor: 'divider' },
          }}
        >
          <TableHead>
            <TableRow>
              <StickyHeaderCell sx={{ width: 184 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 700,
                  }}
                >
                  Reviewer / author
                </Typography>
              </StickyHeaderCell>
              {columns.map((column) => (
                <TableCell
                  key={column.user.id}
                  data-testid={`relationship-matrix-column-${column.user.id}`}
                  align="center"
                  sx={{ width: 136, backgroundColor: 'background.paper', verticalAlign: 'top' }}
                >
                  <PersonColumnHeader user={column.user} isSelectedTeamMember={column.isSelectedTeamMember} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {model.selectedTeamMembers.map((reviewer) => (
              <TableRow key={reviewer.id} hover>
                <StickyRowHeaderCell component="th" scope="row" data-testid={`relationship-matrix-row-${reviewer.id}`}>
                  <PersonRowHeader user={reviewer} />
                </StickyRowHeaderCell>
                {columns.map((column) => {
                  const isSelfRelationship = reviewer.id === column.user.id;
                  const relationship = relationshipsById.get(getRelationshipId(reviewer.id, column.user.id)) ?? null;

                  return (
                    <RelationshipCell
                      key={column.user.id}
                      reviewer={reviewer}
                      author={column.user}
                      relationship={relationship}
                      metric={metric}
                      maxMetricValue={maxMetricValue}
                      selected={relationship?.id === selectedRelationshipId}
                      self={isSelfRelationship}
                      onRelationshipSelect={onRelationshipSelect}
                    />
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  );
}

function PersonColumnHeader({ user, isSelectedTeamMember }: { user: User; isSelectedTeamMember: boolean }) {
  return (
    <Stack
      spacing={0.75}
      sx={{
        alignItems: 'center',
        minWidth: 0,
      }}
    >
      <Avatar
        src={user.avatarUrl}
        alt={user.displayName}
        sx={{ width: 30, height: 30, filter: isSelectedTeamMember ? 'none' : 'grayscale(1)' }}
      />
      <Tooltip title={user.displayName} enterDelay={500}>
        <Typography
          variant="caption"
          sx={{
            display: '-webkit-box',
            minHeight: 36,
            maxWidth: '100%',
            overflow: 'hidden',
            fontWeight: 700,
            lineHeight: 1.35,
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          {user.displayName}
        </Typography>
      </Tooltip>
      {!isSelectedTeamMember && <Chip label="Outside" size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />}
    </Stack>
  );
}

function PersonRowHeader({ user }: { user: User }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Avatar src={user.avatarUrl} alt={user.displayName} sx={{ width: 30, height: 30 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          noWrap
          sx={{
            fontWeight: 700,
          }}
        >
          {user.displayName}
        </Typography>
        <Typography
          variant="caption"
          noWrap
          sx={{
            color: 'text.secondary',
          }}
        >
          {user.userName}
        </Typography>
      </Box>
    </Box>
  );
}

function RelationshipCell({
  reviewer,
  author,
  relationship,
  metric,
  maxMetricValue,
  selected,
  self,
  onRelationshipSelect,
}: {
  reviewer: User;
  author: User;
  relationship: TeamReviewRelationship | null;
  metric: RelationshipMatrixMetric;
  maxMetricValue: number;
  selected: boolean;
  self: boolean;
  onRelationshipSelect: (relationshipId: string) => void;
}) {
  const theme = useTheme();

  if (self) {
    return (
      <TableCell
        align="center"
        data-testid={`relationship-matrix-cell-${reviewer.id}-${author.id}`}
        sx={{ backgroundColor: 'action.hover', color: 'text.disabled' }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
          }}
        >
          Self
        </Typography>
      </TableCell>
    );
  }

  if (!relationship) {
    return (
      <TableCell
        align="center"
        data-testid={`relationship-matrix-cell-${reviewer.id}-${author.id}`}
        sx={{ backgroundColor: 'background.default', color: 'text.disabled' }}
      >
        <Typography
          variant="body2"
          aria-label={`${reviewer.displayName} has no captured relationship with ${author.displayName}`}
        >
          -
        </Typography>
      </TableCell>
    );
  }

  const value = relationship[metric];
  const intensity = maxMetricValue > 0 && value > 0 ? value / maxMetricValue : 0;
  const { backgroundColor, color } = getHeatmapColors(intensity, theme);

  return (
    <TableCell align="center" data-testid={`relationship-matrix-cell-${reviewer.id}-${author.id}`} sx={{ p: 0.75 }}>
      <Box
        component="button"
        type="button"
        data-testid={`relationship-matrix-button-${relationship.id}`}
        data-heat-intensity={intensity.toFixed(2)}
        aria-label={`${reviewer.displayName} reviewed ${author.displayName}: ${value} ${getMetricLabel(metric)}`}
        onClick={() => onRelationshipSelect(relationship.id)}
        sx={{
          width: '100%',
          minHeight: 48,
          border: '1px solid',
          borderColor: selected ? 'secondary.main' : intensity > 0 ? 'transparent' : 'divider',
          borderRadius: 1,
          backgroundColor,
          color,
          cursor: 'pointer',
          font: 'inherit',
          boxShadow: selected ? `0 0 0 2px ${alpha(theme.palette.secondary.main, 0.28)}` : 'none',
          transition: 'border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease',
          '&:hover': {
            borderColor: 'secondary.main',
            boxShadow: theme.shadows[4],
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.secondary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
          }}
        >
          {value}
        </Typography>
      </Box>
    </TableCell>
  );
}

function HeatmapLegend({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        Low
      </Typography>
      {[0.18, 0.38, 0.58, 0.78].map((intensity) => (
        <Box
          key={intensity}
          sx={{
            width: 18,
            height: 10,
            borderRadius: 0.5,
            backgroundColor: getHeatmapColors(intensity, theme).backgroundColor,
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
      ))}
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        High
      </Typography>
    </Box>
  );
}

function getMetricLabel(metric: RelationshipMatrixMetric) {
  return metricOptions.find((option) => option.value === metric)?.label ?? 'relationships';
}

function getHeatmapColors(intensity: number, theme: Theme) {
  if (intensity <= 0) {
    return { backgroundColor: theme.palette.background.default, color: theme.palette.text.disabled };
  }

  if (intensity >= 0.55) {
    return theme.palette.mode === 'dark'
      ? {
          backgroundColor: intensity >= 0.8 ? theme.palette.primary.light : theme.palette.primary.main,
          color: '#0D1017',
        }
      : {
          backgroundColor: intensity >= 0.8 ? theme.palette.primary.dark : theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        };
  }

  return {
    backgroundColor: alpha(theme.palette.primary.main, 0.12 + intensity * 0.48),
    color: theme.palette.text.primary,
  };
}

function StickyHeaderCell({ sx, ...props }: ComponentProps<typeof TableCell>) {
  return (
    <TableCell
      {...props}
      sx={{
        position: 'sticky',
        left: 0,
        zIndex: 4,
        backgroundColor: 'background.paper',
        ...sx,
      }}
    />
  );
}

function StickyRowHeaderCell({ sx, ...props }: ComponentProps<typeof TableCell>) {
  return (
    <TableCell
      {...props}
      sx={{
        position: 'sticky',
        left: 0,
        zIndex: 2,
        backgroundColor: 'background.paper',
        ...sx,
      }}
    />
  );
}
