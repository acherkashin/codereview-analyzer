import { create, StoreApi } from 'zustand';
import createContext from 'zustand/context';
import { AnalyzeParams, Comment, PullRequest, User } from '../services/types';
import { arrange, desc, distinct, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { GitService } from '../services/GitService';
import { convert } from '../services/GitConverter';
import { getEndDate, getStartDate } from '../utils/GitUtils';
import dayjs, { Dayjs } from 'dayjs';
import { ExportData } from '../utils/ExportDataUtils';

const initialState = {
  pullRequests: [] as PullRequest[],
  users: [] as User[],
  exportData: null as ExportData | null,

  // filtering options
  user: undefined as User | undefined,
  startDate: null as Dayjs | null,
  endDate: null as Dayjs | null,
};

type ChartState = typeof initialState;

export type ChartsStore = ChartState & {
  import: (json: string) => void;
  analyze: (client: GitService, params: AnalyzeParams) => Promise<void>;
  closeAnalysis: () => void;
  setUser: (user: User | undefined) => void;
  setStartDate: (start: Dayjs | null) => void;
  setEndDate: (end: Dayjs | null) => void;
};

const { Provider: ChartsStoreProvider, useStore: useChartsStore } = createContext<StoreApi<ChartsStore>>();
export { ChartsStoreProvider, useChartsStore };

export function createChartsStore() {
  return create<ChartsStore>((set, get) => ({
    ...initialState,
    import(json: string) {
      // TODO: add json validation
      const exportData: ExportData = JSON.parse(json);

      initStore(set, exportData);
    },
    analyze: async (client: GitService, params: AnalyzeParams) => {
      const exportData = await client.fetch(params);

      initStore(set, exportData);
    },
    getExportData: () => {
      const { users, exportData: rawData } = get();
      return {
        users,
        rawData,
      };
    },
    closeAnalysis: () => {
      set({ ...initialState });
    },
    setUser(user: User | undefined) {
      set({ ...get(), user });
    },
    setStartDate(start: Dayjs | null) {
      set({ ...get(), startDate: start });
    },
    setEndDate(end: Dayjs | null) {
      set({ ...get(), startDate: end });
    },
  }));
}

const personalPageStore = createChartsStore();

export function createPersonalPageStore() {
  return personalPageStore;
}

const chartsStore = createChartsStore();

export function createCommonChartsStore() {
  return chartsStore;
}

function initStore(set: StoreApi<ChartsStore>['setState'], exportData: ExportData) {
  const { users, pullRequests } = convert(exportData);

  set({
    users,
    pullRequests,
    exportData,
    startDate: dayjs(getStartDate(pullRequests)),
    endDate: dayjs(getEndDate(pullRequests)),
  });
}

export function getComments(state: ChartState) {
  const comments = getFilteredPullRequests(state).flatMap((item) => item.comments);
  return comments;
}

export function getDiscussions(state: ChartState) {
  const discussions = getFilteredPullRequests(state).flatMap((item) => item.discussions);
  return discussions;
}

export function getDefaultFileName(state: ChartState) {
  if (state.pullRequests.length === 0) {
    return null;
  }

  const startDate = getStartDate(state.pullRequests);
  const endDate = getEndDate(state.pullRequests);

  const interval = new Date(startDate).toISOString().substring(0, 10) + ' - ' + new Date(endDate).toISOString().substring(0, 10);
  const hostType = state.exportData!.hostType;

  return `${hostType}-${interval}`;
}

export function getAnalyze(state: ChartsStore) {
  return state.analyze;
}

export function useMostCommentsLeft() {
  return useChartsStore((state) => {
    const comments = getComments(state);
    const data = tidy(comments, groupBy('reviewerId', summarize({ total: n() })), arrange([desc('total')]));
    const user = state.users.find((item) => item.id === data[0]?.reviewerId);

    return {
      user,
      total: data[0]?.total,
    };
  });
}

export function useMostCommentsReceived() {
  return useChartsStore((state) => {
    const comments = getComments(state);
    const data = tidy(comments, groupBy('prAuthorId', summarize({ total: n() })), arrange([desc('total')]));
    const user = state.users.find((item) => item.id === data[0]?.prAuthorId);

    return {
      user,
      total: data[0]?.total,
    };
  });
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
  const start = dayjs(state.startDate ?? new Date()).subtract(1, 'day');
  const end = dayjs(state.endDate ?? new Date()).add(1, 'day');

  const filtered = state.pullRequests.filter((pr) => {
    const isAfter = state.startDate == null || dayjs(pr.createdAt).isAfter(start, 'day');
    const isBefore = state.endDate == null || dayjs(pr.createdAt).isBefore(end, 'day');

    return isAfter && isBefore;
  });

  return filtered;
}
