import { createContext, useContext, useRef } from 'react';
import classNames from 'classnames';
import { AnalyzeParams, Comment, PullRequest, User, UserDiscussion } from '../services/types';
import { arrange, desc, distinct, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { GitService } from '../services/GitService';
import { convert } from '../services/GitConverter';
import { getEndDate, getFilteredComments, getFilteredDiscussions, getStartDate } from '../utils/GitUtils';
import dayjs, { Dayjs } from 'dayjs';
import { ExportData } from '../utils/ExportDataUtils';
import { createStore } from '../utils/ZustandUtils';
import { NamedSet } from 'zustand/middleware/devtools';
import { useStore } from 'zustand';
import { memoize } from 'proxy-memoize';
import { getPullRequestOpenDays, getPullRequestSize, isLargePullRequest } from '../utils/PullRequestMetrics';
import { TeamReviewModel, buildTeamReviewModel } from '../utils/TeamReviewUtils';

const initialState = {
  isAnalyzing: false as boolean,

  pullRequests: null as PullRequest[] | null,
  users: null as User[] | null,
  exportData: null as ExportData | null,

  // filtering options
  user: undefined as User | undefined,
  teamUsers: [] as User[],
  startDate: null as Dayjs | null,
  endDate: null as Dayjs | null,

  // dialog options
  dialogTitle: '',
  filteredDiscussions: null as UserDiscussion[] | null,
  filteredComments: null as Comment[] | null,
};

type ChartState = typeof initialState;

export type ChartsStore = ChartState & {
  actions: ReturnType<typeof createChartsActions>;
};
// https://github.com/pmndrs/zustand/pull/1403/files#r1064836369
export const ChartsStoreContext = createContext<ReturnType<typeof createChartsStore> | null>(null);

export function ChartsStoreProvider({ children }: React.PropsWithChildren) {
  const storeRef = useRef<ReturnType<typeof createChartsStore>>();
  if (!storeRef.current) {
    storeRef.current = createChartsStore();
  }

  return <ChartsStoreContext.Provider value={storeRef.current}>{children}</ChartsStoreContext.Provider>;
}

export function useChartsStore<T>(selector: (state: ChartsStore) => T): T {
  const store = useContext(ChartsStoreContext);
  if (!store) throw new Error('Missing ChartsStoreContext.Provider in the tree');

  return useStore(store, selector);
}

function createChartsStore() {
  return createStore<ChartsStore>(
    (set, get) => ({
      ...initialState,
      actions: createChartsActions(set, get),
    }),
    'ChartsStore'
  );
}

function createChartsActions(set: NamedSet<ChartsStore>, get: () => ChartsStore) {
  return {
    import(json: string) {
      // TODO: add json validation
      const exportData: ExportData = JSON.parse(json);

      initStore(set, exportData);
    },
    analyze: async (client: GitService, params: AnalyzeParams) => {
      if (get().isAnalyzing) return;

      set({ isAnalyzing: true });

      try {
        const exportData = await client.fetch(params);
        initStore(set, exportData);
      } finally {
        set({ isAnalyzing: false });
      }
    },
    getExportData: () => {
      const { users, exportData: rawData } = get();
      return {
        users,
        rawData,
      };
    },
    closeAnalysis: () => {
      set({ ...initialState }, false, 'close analysis');
    },
    setUser(user: User | undefined) {
      set({ ...get(), user }, false, 'filter by user');
    },
    setTeamUsers(teamUsers: User[]) {
      const teamUsersById = new Map(teamUsers.map((teamUser) => [teamUser.id, teamUser]));
      set({ ...get(), teamUsers: [...teamUsersById.values()] }, false, 'filter by team users');
    },
    setStartDate(start: Dayjs | null) {
      set({ ...get(), startDate: start }, false, 'change start date');
    },
    setEndDate(end: Dayjs | null) {
      set({ ...get(), endDate: end }, false, 'change end date');
    },
    showDiscussionsAt(pointDate: Date) {
      const discussions = getDiscussions(get());

      const filteredDiscussions = discussions.filter((item) => {
        const date = new Date(item.comments[0].createdAt);

        return date.getMonth() === pointDate.getMonth() && date.getFullYear() === pointDate.getFullYear();
      });

      set(
        {
          ...get(),
          filteredDiscussions: filteredDiscussions,
          dialogTitle: 'Discussions started at' + pointDate.toLocaleDateString(),
        },
        false,
        'show discussions at'
      );
    },
    showFilteredComments(reviewerName: string | null, authorName: string | null) {
      const comments = getComments(get());
      const filteredComments = getFilteredComments(comments, reviewerName, authorName);

      let title = '';
      if (reviewerName && authorName) {
        title = `Comments received by ${authorName} from ${reviewerName}`;
      } else if (reviewerName) {
        title = `Comments left by ${reviewerName}`;
      } else if (authorName) {
        title = `Comments received by ${authorName}`;
      }

      title += `. Total: ${filteredComments.length}`;

      set(
        {
          filteredComments: filteredComments,
          dialogTitle: title,
        },
        false,
        'show filtered comments'
      );
    },
    showFilteredDiscussions: ({ reviewerId, authorName: authorId, at }: FilterCommentsProps) => {
      const discussions = getDiscussions(get());
      const filteredDiscussions = getFilteredDiscussions(discussions, reviewerId, authorId, at);

      const authorName = get().users?.find((item) => item.id === authorId)?.displayName || authorId;
      const reviewerName = get().users?.find((item) => item.id === reviewerId)?.displayName || reviewerId;

      const title = classNames(
        'Discussions started',
        {
          [` by ${reviewerName}`]: reviewerName,
          [` with ${authorName}`]: authorName,
          [` at ${at?.toLocaleDateString()}`]: at,
        },
        `. Total: ${filteredDiscussions.length}`
      );

      set(
        {
          filteredDiscussions,
          dialogTitle: title,
        },
        false,
        'show filtered discussions'
      );
    },
    showDiscussion(discussion: UserDiscussion) {
      set(
        {
          filteredDiscussions: [discussion],
          dialogTitle: `Discussion started by ${discussion.reviewerName} in ${discussion.pullRequestName}`,
        },
        false,
        'show discussion'
      );
    },
    showCommentsWithWord(word: string) {
      const comments = getComments(get());
      const filtered = comments.filter((item) => item.body.includes(word));

      set(
        {
          filteredComments: filtered,
          dialogTitle: `Comments containing "${word}". Count: ${filtered.length}`,
        },
        false,
        'show comments with word'
      );
    },
    closeDialog() {
      set(
        {
          filteredComments: null,
          filteredDiscussions: null,
          dialogTitle: '',
        },
        false,
        'close dialog'
      );
    },
  };
}

export interface FilterCommentsProps {
  reviewerId?: string | null;
  authorName?: string | null;
  at?: Date;
}

export interface OneOnOneReviewActivity {
  reviewedPullRequestsCount: number;
  discussionsStartedCount: number;
}

export interface OneOnOneInsights {
  reviewedPullRequestsCount: number;
  discussionsStartedCount: number;
  authoredPullRequestsCount: number;
  uniqueReviewersCount: number;
  uniqueReviewedAuthorsCount: number;
  medianOpenDays: number;
  averageOpenDays: number;
  medianPrSize: number;
  averagePrSize: number;
  largePullRequestsCount: number;
}

export interface OneOnOneReviewedPullRequestActivity {
  pullRequest: PullRequest;
  commentsBySelectedReviewer: Comment[];
  discussionsStartedBySelectedReviewer: UserDiscussion[];
  reviewActivitiesBySelectedReviewer: PullRequest['reviewedByUser'];
}

export interface OneOnOnePersonRelationshipRow {
  user: User;
  pullRequestCount: number;
}

function initStore(set: NamedSet<ChartsStore>, exportData: ExportData) {
  const { users, pullRequests } = convert(exportData);

  set(
    {
      users,
      pullRequests,
      exportData,
      startDate: dayjs(getStartDate(pullRequests)),
      endDate: dayjs(getEndDate(pullRequests)),
    },
    false,
    'initStore'
  );
}

// selectors

export function getComments(state: ChartState) {
  const comments = getFilteredPullRequests(state).flatMap((item) => item.comments);
  return comments;
}

export function getDiscussions(state: ChartState) {
  const discussions = getFilteredPullRequests(state).flatMap((item) => item.discussions);
  return discussions;
}

export function getDefaultFileName(state: ChartState) {
  if (state.pullRequests == null || state.pullRequests.length === 0) {
    return null;
  }

  const startDate = getStartDate(state.pullRequests);
  const endDate = getEndDate(state.pullRequests);

  const interval = new Date(startDate).toISOString().substring(0, 10) + ' - ' + new Date(endDate).toISOString().substring(0, 10);
  const hostType = state.exportData!.hostType;

  return `${hostType}-${interval}`;
}

export function getAnalyze(state: ChartsStore) {
  return state.actions.analyze;
}

export function getMostCommentsLeft(state: ChartsStore) {
  const comments = getComments(state);
  const data = tidy(comments, groupBy('reviewerId', summarize({ total: n() })), arrange([desc('total')]));
  const user = (state.users ?? []).find((item) => item.id === data[0]?.reviewerId);

  return {
    user,
    total: data[0]?.total,
  };
}

export function getMostCommentsReceived(state: ChartsStore) {
  const comments = getComments(state);
  const data = tidy(comments, groupBy('prAuthorId', summarize({ total: n() })), arrange([desc('total')]));
  const user = (state.users ?? []).find((item) => item.id === data[0]?.prAuthorId);

  return {
    user,
    total: data[0]?.total,
  };
}

export function getCommentedFilesCount(comments: Comment[]) {
  const changedFiles = tidy(comments, distinct(['filePath'])).map((item) => item.filePath);

  return changedFiles.length;
}

export function getExportData(state: ChartsStore) {
  return state.exportData;
}

export function getHostType(state: ChartState) {
  return state.exportData?.hostType;
}

export function getUserPullRequests(state: ChartState) {
  if (state.user) {
    const filtered = getFilteredPullRequests(state);
    const userPrs = filtered.filter((item) => item.author.id === state.user!.id);
    return userPrs;
  }

  return [];
}

export function getUserComments(state: ChartState) {
  if (state.user) {
    const comments = getComments(state);
    const userComments = comments.filter((item) => item.reviewerId === state.user!.id);

    return userComments;
  }

  return [];
}

export function getUserDiscussions(state: ChartState) {
  if (state.user) {
    const comments = getDiscussions(state);
    const userDiscussions = comments.filter((item) => item.reviewerId === state.user!.id);

    return userDiscussions;
  }

  return [];
}

export const getOneOnOnePullRequests = memoize((state: ChartState) => {
  if (!state.user) {
    return [];
  }

  return getFilteredPullRequests(state).filter((item) => item.author.id === state.user!.id);
});

export const getOneOnOneReviewActivity = memoize((state: ChartState): OneOnOneReviewActivity => {
  if (!state.user) {
    return {
      reviewedPullRequestsCount: 0,
      discussionsStartedCount: 0,
    };
  }

  const userId = state.user.id;
  const filteredPullRequests = getFilteredPullRequests(state);
  const reviewedPullRequestIds = new Set<string>();

  filteredPullRequests.forEach((pullRequest) => {
    if (pullRequest.comments.some((comment) => comment.reviewerId === userId)) {
      reviewedPullRequestIds.add(pullRequest.id);
    }

    if (pullRequest.discussions.some((discussion) => discussion.reviewerId === userId)) {
      reviewedPullRequestIds.add(pullRequest.id);
    }

    if (pullRequest.reviewedByUser.some((activity) => activity.user.id === userId)) {
      reviewedPullRequestIds.add(pullRequest.id);
    }
  });

  return {
    reviewedPullRequestsCount: reviewedPullRequestIds.size,
    discussionsStartedCount: getDiscussions(state).filter((item) => item.reviewerId === userId).length,
  };
});

export const getOneOnOneReviewedBy = memoize((state: ChartState): OneOnOnePersonRelationshipRow[] => {
  if (!state.user) {
    return [];
  }

  const relationships = new Map<string, { user: User; pullRequestIds: Set<string> }>();

  getOneOnOnePullRequests(state).forEach((pullRequest) => {
    const participants = new Map<string, User>();

    pullRequest.reviewedByUser.forEach((activity) => {
      if (activity.user.id !== state.user!.id) {
        participants.set(activity.user.id, activity.user);
      }
    });

    pullRequest.comments.forEach((comment) => {
      if (comment.reviewerId !== state.user!.id) {
        participants.set(comment.reviewerId, getUserFromReviewer(state, comment.reviewerId, comment.reviewerName, comment.reviewerAvatarUrl));
      }
    });

    pullRequest.discussions.forEach((discussion) => {
      if (discussion.reviewerId !== state.user!.id) {
        participants.set(
          discussion.reviewerId,
          getUserFromReviewer(state, discussion.reviewerId, discussion.reviewerName, discussion.reviewerAvatarUrl)
        );
      }
    });

    participants.forEach((participant, reviewerId) => {
      const existing = relationships.get(reviewerId);

      if (existing) {
        existing.pullRequestIds.add(pullRequest.id);
        return;
      }

      relationships.set(reviewerId, {
        user: participant,
        pullRequestIds: new Set([pullRequest.id]),
      });
    });
  });

  return getRelationshipRows(relationships);
});

export const getOneOnOneReviewedPullRequests = memoize((state: ChartState): OneOnOneReviewedPullRequestActivity[] => {
  if (!state.user) {
    return [];
  }

  const userId = state.user.id;

  return getFilteredPullRequests(state)
    .filter((pullRequest) => pullRequest.author.id !== userId)
    .map<OneOnOneReviewedPullRequestActivity | null>((pullRequest) => {
      const commentsBySelectedReviewer = pullRequest.comments.filter((comment) => comment.reviewerId === userId);
      const discussionsStartedBySelectedReviewer = pullRequest.discussions.filter((discussion) => discussion.reviewerId === userId);
      const reviewActivitiesBySelectedReviewer = pullRequest.reviewedByUser.filter((activity) => activity.user.id === userId);

      if (
        commentsBySelectedReviewer.length === 0 &&
        discussionsStartedBySelectedReviewer.length === 0 &&
        reviewActivitiesBySelectedReviewer.length === 0
      ) {
        return null;
      }

      return {
        pullRequest,
        commentsBySelectedReviewer,
        discussionsStartedBySelectedReviewer,
        reviewActivitiesBySelectedReviewer,
      };
    })
    .filter((item): item is OneOnOneReviewedPullRequestActivity => item != null)
    .sort((left, right) => new Date(right.pullRequest.createdAt).getTime() - new Date(left.pullRequest.createdAt).getTime());
});

export const getOneOnOneReviewsFor = memoize((state: ChartState): OneOnOnePersonRelationshipRow[] => {
  if (!state.user) {
    return [];
  }

  const relationships = new Map<string, { user: User; pullRequestIds: Set<string> }>();

  getOneOnOneReviewedPullRequests(state).forEach(({ pullRequest }) => {
    const existing = relationships.get(pullRequest.author.id);

    if (existing) {
      existing.pullRequestIds.add(pullRequest.id);
      return;
    }

    relationships.set(pullRequest.author.id, {
      user: pullRequest.author,
      pullRequestIds: new Set([pullRequest.id]),
    });
  });

  return getRelationshipRows(relationships);
});

export const getOneOnOneInsights = memoize((state: ChartState): OneOnOneInsights => {
  const pullRequests = getOneOnOnePullRequests(state);
  const reviewActivity = getOneOnOneReviewActivity(state);
  const reviewedBy = getOneOnOneReviewedBy(state);
  const reviewsFor = getOneOnOneReviewsFor(state);

  return {
    reviewedPullRequestsCount: reviewActivity.reviewedPullRequestsCount,
    discussionsStartedCount: reviewActivity.discussionsStartedCount,
    authoredPullRequestsCount: pullRequests.length,
    uniqueReviewersCount: reviewedBy.length,
    uniqueReviewedAuthorsCount: reviewsFor.length,
    medianOpenDays: getMedian(pullRequests.map(getPullRequestOpenDays)),
    averageOpenDays: getAverage(pullRequests.map(getPullRequestOpenDays)),
    medianPrSize: getMedian(pullRequests.map(getPullRequestSize)),
    averagePrSize: getAverage(pullRequests.map(getPullRequestSize)),
    largePullRequestsCount: pullRequests.filter(isLargePullRequest).length,
  };
});

export const getOneOnOneHighlights = memoize((state: ChartState) => {
  const insights = getOneOnOneInsights(state);
  const pullRequests = getOneOnOnePullRequests(state);
  const highlights: string[] = [];

  if (insights.authoredPullRequestsCount === 0) {
    return highlights;
  }

  if (insights.largePullRequestsCount > 0) {
    highlights.push(
      `${insights.largePullRequestsCount} authored PR${insights.largePullRequestsCount === 1 ? ' was' : 's were'} large or very large`
    );
  }

  if (insights.averageOpenDays >= 5 || insights.medianOpenDays >= 5) {
    highlights.push(`PRs are staying open longer than expected (${insights.averageOpenDays}d average open time)`);
  }

  if (insights.uniqueReviewersCount <= 2 && insights.authoredPullRequestsCount >= 2) {
    highlights.push(`Work was reviewed by ${insights.uniqueReviewersCount} teammate${insights.uniqueReviewersCount === 1 ? '' : 's'}`);
  }

  if (insights.uniqueReviewedAuthorsCount >= 3) {
    highlights.push(`Reviewed work for ${insights.uniqueReviewedAuthorsCount} teammates in this period`);
  }

  const averageDiscussionLoad = getAverage(pullRequests.map((item) => item.reviewCommentCount + item.discussionCount));
  if (averageDiscussionLoad >= 6) {
    highlights.push(`Changes are attracting a lot of review discussion (${averageDiscussionLoad} conversations per PR on average)`);
  }

  if (highlights.length === 0) {
    highlights.push('Recent PR activity looks balanced for a 1:1 review');
  }

  return highlights.slice(0, 5);
});

export const getOneOnOneActionItems = memoize((state: ChartState) => {
  const insights = getOneOnOneInsights(state);
  const pullRequests = getOneOnOnePullRequests(state);
  const actionItems: string[] = [];

  if (insights.authoredPullRequestsCount === 0) {
    return actionItems;
  }

  if (insights.largePullRequestsCount > 0) {
    actionItems.push('Try splitting large changes into smaller pull requests');
  }

  if (insights.averageOpenDays >= 5 || insights.medianOpenDays >= 5) {
    actionItems.push('Agree on a faster review SLA for active pull requests');
  }

  if (insights.uniqueReviewersCount <= 2 && insights.authoredPullRequestsCount >= 2) {
    actionItems.push('Broaden reviewer participation so authored changes get more consistent coverage');
  }

  const averageDiscussionLoad = getAverage(pullRequests.map((item) => item.reviewCommentCount + item.discussionCount));
  if (averageDiscussionLoad >= 6) {
    actionItems.push('Call out recurring review themes and address them earlier in the PR');
  }

  if (actionItems.length === 0) {
    actionItems.push('Keep using the current pull request size and review cadence');
  }

  return actionItems.slice(0, 4);
});

export const getTeamReviewModel = memoize((state: ChartState): TeamReviewModel => {
  return buildTeamReviewModel(getFilteredPullRequests(state), state.teamUsers);
});

export const getTeamReviewSelectedUsers = memoize((state: ChartState) => {
  return state.teamUsers;
});

export const getTeamReviewAuthoredPullRequests = memoize((state: ChartState) => {
  return getTeamReviewModel(state).authoredPullRequests;
});

export const getFilteredPullRequests = memoize((state: ChartState) => {
  if (state.pullRequests == null) {
    return [];
  }

  const start = dayjs(state.startDate ?? new Date()).subtract(1, 'day');
  const end = dayjs(state.endDate ?? new Date()).add(1, 'day');

  const filtered = state.pullRequests.filter((pr) => {
    const isAfter = state.startDate == null || dayjs(pr.createdAt).isAfter(start, 'day');
    const isBefore = state.endDate == null || dayjs(pr.createdAt).isBefore(end, 'day');

    return isAfter && isBefore;
  });

  return filtered;
});

export function getUser(state: ChartState) {
  return state.user;
}

export function getAllUsers(state: ChartState) {
  return state.users;
}

function getMedian(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return sorted[middle];
}

function getAverage(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
}

function getRelationshipRows(relationships: Map<string, { user: User; pullRequestIds: Set<string> }>): OneOnOnePersonRelationshipRow[] {
  return Array.from(relationships.values())
    .map(({ user, pullRequestIds }) => ({
      user,
      pullRequestCount: pullRequestIds.size,
    }))
    .sort((left, right) => {
      if (right.pullRequestCount !== left.pullRequestCount) {
        return right.pullRequestCount - left.pullRequestCount;
      }

      return left.user.displayName.localeCompare(right.user.displayName);
    });
}

function getUserFromReviewer(
  state: ChartState,
  reviewerId: string,
  reviewerName: string,
  reviewerAvatarUrl?: string
): User {
  const existingUser = state.users?.find((item) => item.id === reviewerId);

  if (existingUser) {
    return existingUser;
  }

  return {
    id: reviewerId,
    fullName: reviewerName,
    userName: reviewerName,
    displayName: reviewerName,
    avatarUrl: reviewerAvatarUrl ?? '',
    webUrl: '',
    active: true,
  };
}
