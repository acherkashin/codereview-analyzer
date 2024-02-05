import create, { StoreApi } from 'zustand';
import {
  convertToPullRequestCreated,
  convertToCommentsLeft,
  convertToCommentsLeftToUsers,
  convertToCommentsReceived,
  convertToCommentsReceivedFromUsers,
  convertToDiscussionsLeft,
  convertToDiscussionsReceived,
  convertToFilesCommented,
} from '../utils/ChartUtils';
import {
  convertToCommentsLeftPieChart,
  convertToCommentsReceivedPieChart,
  convertToDiscussionsReceivedPieChart,
  convertToDiscussionsStartedPieChart,
  getWhoApprovesUser,
  getWhoAssignsToAuthorToReview,
  getWhomAuthorAssignsToReview as convertAssignedToReview,
  getWhomUserApproves,
  PieChartDatum,
} from '../utils/PieChartUtils';
import createContext from 'zustand/context';
import { AnalyzeParams, Client, PullRequest, User } from '../clients/types';
import { convertToCommentsLineChart } from '../utils/LineChartUtils';
import { arrange, desc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';

export interface ChartsStore {
  pullRequests: PullRequest[];
  users: User[];
  setPullRequests: (pullRequests: PullRequest[]) => void;
  analyze: (client: Client, params: AnalyzeParams) => Promise<void>;
}

const { Provider: ChartsStoreProvider, useStore: useChartsStore } = createContext<StoreApi<ChartsStore>>();
export { ChartsStoreProvider, useChartsStore };

export function createChartsStore() {
  return create<ChartsStore>((set, get) => ({
    pullRequests: [],
    discussions: [],
    users: [],
    setPullRequests(pullRequests: PullRequest[]) {
      set({
        pullRequests,
      });
    },
    analyze: async (client: Client, params: AnalyzeParams) => {
      const users = await client.getAllUsers();
      const mergeRequests = await client.analyze(params);

      set({
        users,
        pullRequests: mergeRequests,
      });
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

export function getComments(state: ChartsStore) {
  const comments = state.pullRequests.flatMap((item) => item.comments);
  return comments;
}

export function getDiscussionsLeft(state: ChartsStore) {
  return convertToDiscussionsLeft(/*state.discussions*/ []);
}

export function getDiscussionsReceived(state: ChartsStore) {
  return convertToDiscussionsReceived(/*state.discussions*/ []);
}

export function getCommentsLeft(state: ChartsStore) {
  return convertToCommentsLeft(getComments(state));
}

export function getCommentsReceived(state: ChartsStore) {
  return convertToCommentsReceived(getComments(state));
}

export function getCreatedPullRequestsPieChart(state: ChartsStore) {
  return convertToPullRequestCreated(state.pullRequests);
}

export function getCommentedFilesPieChart(state: ChartsStore) {
  return convertToFilesCommented(getComments(state));
}

export function getCommentsLineChart(state: ChartsStore) {
  return convertToCommentsLineChart(getComments(state));
}

export function getCommentsReceivedPieChart(state: ChartsStore) {
  return convertToCommentsReceivedPieChart(getComments(state));
}

export function getCommentsLeftPieChart(state: ChartsStore) {
  return convertToCommentsLeftPieChart(getComments(state));
}

export function getDiscussionsReceivedPieChart(state: ChartsStore) {
  return convertToDiscussionsReceivedPieChart(/*state.discussions*/ []);
}

export function getDiscussionsStartedPieChart(state: ChartsStore) {
  return convertToDiscussionsStartedPieChart(/*state.discussions*/ []);
}

export function getAnalyze(state: ChartsStore) {
  return state.analyze;
}

export function useWhomAssignedToReviewPieChart(authorId?: string): PieChartDatum[] {
  return useChartsStore((state) => {
    if (!authorId) {
      return [];
    }

    const authorMrs = state.pullRequests.filter((item) => item.author.id === authorId);
    return convertAssignedToReview(authorMrs);
  });
}

export function useWhoAssignsToAuthorToReviewPieChart(authorId?: string): PieChartDatum[] {
  return useChartsStore((state) => {
    if (authorId == null) {
      return [];
    }

    const reviewerMrs = state.pullRequests.filter((item) => (item.reviewers ?? []).map((item) => item.id).includes(authorId));
    return getWhoAssignsToAuthorToReview(reviewerMrs);
  });
}

export function useCommentsReceivedFromUsers(userId?: string) {
  return useChartsStore((state) => {
    if (userId == null) {
      return [];
    }

    return convertToCommentsReceivedFromUsers(getComments(state), userId);
  });
}

export function useCommentsLeftToUsers(userId?: string) {
  return useChartsStore((state) => {
    if (userId == null) {
      return [];
    }

    return convertToCommentsLeftToUsers(getComments(state), userId);
  });
}

export function useMostCommentsLeft() {
  return useChartsStore((state) => {
    const comments = getComments(state);
    const data = tidy(comments, groupBy('reviewerId', summarize({ total: n() })), arrange([desc('total')]));
    return {
      user: state.users.find((item) => item.id === data[0].reviewerId),
      total: data[0]?.total,
    };
  });
}

// export function useWhoApprovesMergeRequests(client: Resources.Gitlab, projectId?: number, userId?: number) {
//   const [whoApprovesUser, setWhoApprovesUser] = useState<PieChartDatum[]>([]);
//   const [whomUserApproves, setWhomUserApproves] = useState<PieChartDatum[]>([]);

//   useChartsStore((state) => {
//     if (userId == null || state.mergeRequests.length === 0 || !projectId) {
//       return [];
//     }

//     getMergeRequestsWithApprovals(client, projectId, state.mergeRequests).then((response) => {
//       setWhoApprovesUser(getWhoApprovesUser(response, userId));
//       setWhomUserApproves(getWhomUserApproves(response, userId));
//     });
//   });

//   return {
//     whoApprovesUser,
//     whomUserApproves,
//   };
// }
