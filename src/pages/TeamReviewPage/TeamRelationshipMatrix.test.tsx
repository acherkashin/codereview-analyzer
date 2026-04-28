import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { User } from '../../services/types';
import { TeamReviewModel, TeamReviewRelationship, getRelationshipId } from '../../utils/TeamReviewUtils';
import { RelationshipMatrixMetric, TeamRelationshipMatrix } from './TeamRelationshipMatrix';

const alice: User = {
  id: 'alice',
  fullName: 'Alice Reviewer',
  userName: 'alice',
  displayName: 'Alice Reviewer',
  avatarUrl: '',
  webUrl: '',
  active: true,
};

const bob: User = {
  id: 'bob',
  fullName: 'Bob Builder',
  userName: 'bob',
  displayName: 'Bob Builder',
  avatarUrl: '',
  webUrl: '',
  active: true,
};

const carol: User = {
  id: 'carol',
  fullName: 'Carol Coder',
  userName: 'carol',
  displayName: 'Carol Coder',
  avatarUrl: '',
  webUrl: '',
  active: true,
};

describe('TeamRelationshipMatrix', () => {
  it('renders selected reviewers as rows and team authors before outside authors', () => {
    const { container } = renderMatrix();

    expect(getTestIds(container, 'relationship-matrix-row-')).toEqual([
      'relationship-matrix-row-alice',
      'relationship-matrix-row-bob',
    ]);
    expect(getTestIds(container, 'relationship-matrix-column-')).toEqual([
      'relationship-matrix-column-alice',
      'relationship-matrix-column-bob',
      'relationship-matrix-column-carol',
    ]);
    expect(screen.getByTestId('relationship-matrix-cell-alice-alice')).toHaveTextContent('Self');
    expect(screen.getByTestId('relationship-matrix-cell-bob-carol')).toHaveTextContent('-');
    expect(screen.getByText('Outside')).toBeInTheDocument();
  });

  it('omits outside authors when the visible model has no outside relationships', () => {
    const { container } = renderMatrix({ model: createModel({ includeOutside: false }) });

    expect(getTestIds(container, 'relationship-matrix-column-')).toEqual([
      'relationship-matrix-column-alice',
      'relationship-matrix-column-bob',
    ]);
    expect(screen.queryByTestId('relationship-matrix-column-carol')).not.toBeInTheDocument();
  });

  it('changes displayed values and heatmap intensity with the selected metric', () => {
    const { rerender } = renderMatrix();
    const relationshipId = getRelationshipId(alice.id, bob.id);

    expect(screen.getByTestId(`relationship-matrix-button-${relationshipId}`)).toHaveTextContent('3');
    expect(screen.getByTestId(`relationship-matrix-button-${relationshipId}`)).toHaveAttribute('data-heat-intensity', '0.75');

    rerender(createMatrixElement({ metric: 'approvalsCount' }));
    expect(screen.getByTestId(`relationship-matrix-button-${relationshipId}`)).toHaveTextContent('1');
    expect(screen.getByTestId(`relationship-matrix-button-${relationshipId}`)).toHaveAttribute('data-heat-intensity', '0.50');

    rerender(createMatrixElement({ metric: 'discussionsStartedCount' }));
    expect(screen.getByTestId(`relationship-matrix-button-${relationshipId}`)).toHaveTextContent('2');
    expect(screen.getByTestId(`relationship-matrix-button-${relationshipId}`)).toHaveAttribute('data-heat-intensity', '1.00');
  });

  it('selects populated relationship cells and ignores empty or self cells', () => {
    const onRelationshipSelect = vi.fn();
    renderMatrix({ onRelationshipSelect });

    fireEvent.click(screen.getByTestId(`relationship-matrix-button-${getRelationshipId(alice.id, bob.id)}`));
    fireEvent.click(screen.getByTestId('relationship-matrix-cell-bob-carol'));
    fireEvent.click(screen.getByTestId('relationship-matrix-cell-alice-alice'));

    expect(onRelationshipSelect).toHaveBeenCalledTimes(1);
    expect(onRelationshipSelect).toHaveBeenCalledWith(getRelationshipId(alice.id, bob.id));
  });

  it('emits metric changes from the heatmap switcher', () => {
    const onMetricChange = vi.fn();
    renderMatrix({ onMetricChange });

    fireEvent.click(screen.getByRole('button', { name: 'Use approvals as heatmap metric' }));

    expect(onMetricChange).toHaveBeenCalledWith('approvalsCount');
  });
});

function renderMatrix({
  model = createModel(),
  metric = 'reviewedPullRequestsCount',
  selectedRelationshipId = null,
  onMetricChange = vi.fn(),
  onRelationshipSelect = vi.fn(),
}: Partial<{
  model: TeamReviewModel;
  metric: RelationshipMatrixMetric;
  selectedRelationshipId: string | null;
  onMetricChange: (metric: RelationshipMatrixMetric) => void;
  onRelationshipSelect: (relationshipId: string) => void;
}> = {}) {
  return render(createMatrixElement({ model, metric, selectedRelationshipId, onMetricChange, onRelationshipSelect }));
}

function createMatrixElement({
  model = createModel(),
  metric = 'reviewedPullRequestsCount',
  selectedRelationshipId = null,
  onMetricChange = vi.fn(),
  onRelationshipSelect = vi.fn(),
}: Partial<{
  model: TeamReviewModel;
  metric: RelationshipMatrixMetric;
  selectedRelationshipId: string | null;
  onMetricChange: (metric: RelationshipMatrixMetric) => void;
  onRelationshipSelect: (relationshipId: string) => void;
}> = {}) {
  return (
    <TeamRelationshipMatrix
      model={model}
      metric={metric}
      selectedRelationshipId={selectedRelationshipId}
      onMetricChange={onMetricChange}
      onRelationshipSelect={onRelationshipSelect}
    />
  );
}

function createModel({ includeOutside = true }: { includeOutside?: boolean } = {}): TeamReviewModel {
  const relationships = [
    createRelationship({
      reviewer: alice,
      author: bob,
      isAuthorSelectedTeamMember: true,
      reviewedPullRequestsCount: 3,
      approvalsCount: 1,
      discussionsStartedCount: 2,
      commentsCount: 5,
    }),
    createRelationship({
      reviewer: bob,
      author: alice,
      isAuthorSelectedTeamMember: true,
      reviewedPullRequestsCount: 1,
      approvalsCount: 0,
      discussionsStartedCount: 0,
      commentsCount: 1,
    }),
  ];

  if (includeOutside) {
    relationships.push(
      createRelationship({
        reviewer: alice,
        author: carol,
        isAuthorSelectedTeamMember: false,
        reviewedPullRequestsCount: 4,
        approvalsCount: 2,
        discussionsStartedCount: 0,
        commentsCount: 3,
      })
    );
  }

  return {
    selectedTeamMembers: [alice, bob],
    authoredPullRequests: [],
    nodes: [],
    relationships,
    summary: {
      teamMembersCount: 2,
      authoredPullRequestsCount: 0,
      reviewedPullRequestsCount: 0,
      approvalsCount: 0,
      discussionsStartedCount: 0,
      commentsCount: 0,
      sizeTierCounts: {
        compact: 0,
        medium: 0,
        large: 0,
        veryLarge: 0,
      },
    },
    approvalShare: [],
    discussionShare: [],
  };
}

function createRelationship({
  reviewer,
  author,
  isAuthorSelectedTeamMember,
  reviewedPullRequestsCount,
  approvalsCount,
  discussionsStartedCount,
  commentsCount,
}: Pick<
  TeamReviewRelationship,
  | 'reviewer'
  | 'author'
  | 'isAuthorSelectedTeamMember'
  | 'reviewedPullRequestsCount'
  | 'approvalsCount'
  | 'discussionsStartedCount'
  | 'commentsCount'
>): TeamReviewRelationship {
  return {
    id: getRelationshipId(reviewer.id, author.id),
    reviewer,
    author,
    isAuthorSelectedTeamMember,
    reviewedPullRequestsCount,
    approvalsCount,
    discussionsStartedCount,
    commentsCount,
    pullRequests: [],
  };
}

function getTestIds(container: HTMLElement, prefix: string) {
  return [...container.querySelectorAll(`[data-testid^="${prefix}"]`)].map((element) => element.getAttribute('data-testid'));
}
