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
  Typography,
} from '@mui/material';
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
        >
          {metricOptions.map((option) => (
            <ToggleButton key={option.value} value={option.value} aria-label={option.ariaLabel}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <HeatmapLegend label={currentMetricLabel} />
      </Box>

      <Box sx={{ overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 620 }}>
        <Table
          stickyHeader
          size="small"
          aria-label="Reviewer to author relationship matrix"
          sx={{
            minWidth: Math.max(720, 220 + columns.length * 150),
            tableLayout: 'fixed',
          }}
        >
          <TableHead>
            <TableRow>
              <StickyHeaderCell sx={{ width: 220 }}>
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
                  sx={{ width: 150, backgroundColor: 'background.paper', verticalAlign: 'top' }}
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
      <Typography
        variant="caption"
        noWrap
        sx={{
          fontWeight: 700,
          maxWidth: '100%',
        }}
      >
        {user.displayName}
      </Typography>
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
  if (self) {
    return (
      <TableCell
        align="center"
        data-testid={`relationship-matrix-cell-${reviewer.id}-${author.id}`}
        sx={{ backgroundColor: '#F8FAFC', color: 'text.disabled' }}
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
        sx={{ backgroundColor: '#FCFCFD', color: 'text.disabled' }}
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
  const backgroundColor = getHeatmapBackground(intensity);
  const color = intensity > 0.58 ? '#FFFFFF' : '#121828';

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
          borderColor: selected ? '#5048E5' : intensity > 0 ? 'transparent' : '#E5E7EB',
          borderRadius: 1,
          backgroundColor,
          color,
          cursor: 'pointer',
          font: 'inherit',
          boxShadow: selected ? '0 0 0 2px rgba(80, 72, 229, 0.22)' : 'none',
          transition: 'border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease',
          '&:hover': {
            borderColor: '#5048E5',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.16)',
          },
          '&:focus-visible': {
            outline: '2px solid #5048E5',
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
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
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
            backgroundColor: getHeatmapBackground(intensity),
            border: '1px solid rgba(80, 72, 229, 0.18)',
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

function getHeatmapBackground(intensity: number) {
  if (intensity <= 0) {
    return '#FFFFFF';
  }

  const alpha = 0.12 + intensity * 0.62;
  return `rgba(80, 72, 229, ${alpha.toFixed(2)})`;
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
