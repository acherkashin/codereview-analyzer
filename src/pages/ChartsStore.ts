import create from 'zustand';
import {
  convertToCommentsLeft,
  convertToCommentsReceived,
  convertToDiscussionsLeft,
  convertToDiscussionsReceived,
} from '../utils/ChartUtils';
import { getDiscussions, getUserComments, UserComment, UserDiscussion } from './../utils/GitLabUtils';
import { Resources } from '@gitbeaker/core';

export interface ChartsStore {
  comments: UserComment[];
  discussions: UserDiscussion[];
  setComments: (newComments: UserComment[]) => void;
  setDiscussions: (newDiscussions: UserDiscussion[]) => void;
  showComments: (client: Resources.Gitlab, projectId: number, createdAfter: Date, createdBefore: Date) => Promise<void>;
  showDiscussions: (client: Resources.Gitlab, projectId: number, createdAfter: Date, createdBefore: Date) => Promise<void>;
  analyze: (client: Resources.Gitlab, projectId: number, createdAfter: Date, createdBefore: Date) => Promise<[void, void]>;
}

export const useChartsStore = create<ChartsStore>((set, get) => ({
  comments: [],
  discussions: [],
  setComments: (newComments: UserComment[]) => set({ comments: newComments }),
  setDiscussions: (newDiscussions: UserDiscussion[]) => set({ discussions: newDiscussions }),
  showComments: async (client: Resources.Gitlab, projectId: number, createdAfter: Date, createdBefore: Date) => {
    if (projectId == null) {
      return;
    }

    try {
      const comments = await getUserComments(client, {
        projectId: projectId,
        createdAfter: createdAfter.toISOString(),
        createdBefore: createdBefore.toISOString(),
      });

      set({ comments });
    } catch (ex) {
      console.error(ex);
    }
  },
  showDiscussions: async (client: Resources.Gitlab, projectId: number, createdAfter: Date, createdBefore: Date) => {
    try {
      if (projectId == null) {
        return;
      }

      const discussions = await getDiscussions(client, {
        projectId: projectId,
        createdAfter: createdAfter.toISOString(),
        createdBefore: createdBefore.toISOString(),
      });

      set({ discussions });
    } catch (ex) {
      console.error(ex);
    }
  },
  analyze: (client: Resources.Gitlab, projectId: number, createdAfter: Date, createdBefore: Date) => {
    const state = get();
    return Promise.all([
      state.showComments(client, projectId, createdAfter, createdBefore),
      state.showDiscussions(client, projectId, createdAfter, createdBefore),
    ]);
  },
}));

export function getDiscussionsLeft(state: ChartsStore) {
  return convertToDiscussionsLeft(state.discussions);
}

export function getDiscussionsReceived(state: ChartsStore) {
  return convertToDiscussionsReceived(state.discussions);
}

export function getCommentsLeft(state: ChartsStore) {
  return convertToCommentsLeft(state.comments);
}

export function getCommentsReceived(state: ChartsStore) {
  return convertToCommentsReceived(state.comments);
}

export function getAnalyze(state: ChartsStore) {
  return state.analyze;
}
