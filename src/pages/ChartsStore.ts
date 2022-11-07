import create from 'zustand';
import { UserComment, UserDiscussion } from './../utils/GitLabUtils';

export interface ChartsStore {
  comments: UserComment[];
  discussions: UserDiscussion[];
  setComments: (newComments: UserComment[]) => void;
  setDiscussions: (newDiscussions: UserDiscussion[]) => void;
}

export const useChartsStore = create<ChartsStore>((set) => ({
  comments: [],
  discussions: [],
  setComments: (newComments: UserComment[]) => set({ comments: newComments }),
  setDiscussions: (newDiscussions: UserDiscussion[]) => set({ discussions: newDiscussions }),
}));
