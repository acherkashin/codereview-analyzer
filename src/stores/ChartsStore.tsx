import { createContext, useContext, useRef } from 'react';
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

const initialState = {
  isAnalyzing: false as boolean,

  pullRequests: null as PullRequest[] | null,
  users: null as User[] | null,
  exportData: null as ExportData | null,

  // filtering options
  user: undefined as User | undefined,
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
    showFilteredDiscussions: (reviewerName: string | null, authorName: string | null) => {
      const discussions = getDiscussions(get());
      const filteredDiscussions = getFilteredDiscussions(discussions, reviewerName, authorName);

      let title = '';
      if (reviewerName && authorName) {
        title = `Discussions started by ${reviewerName} with ${authorName}`;
      } else if (reviewerName) {
        title = `Discussions started by ${reviewerName}`;
      } else if (authorName) {
        title = `Discussions started with ${authorName}`;
      }
      title += `. Total: ${filteredDiscussions.length}`;

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

export function getFilteredPullRequests(state: ChartState) {
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
}

export function getUser(state: ChartState) {
  return state.user;
}

export function getAllUsers(state: ChartState) {
  return state.users;
}
