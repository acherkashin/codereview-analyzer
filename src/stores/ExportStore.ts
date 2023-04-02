import create, { StoreApi } from 'zustand';
import { MergeRequestSchema } from '@gitbeaker/core/dist/types/types';
import { getDiscussions, getUserComments, UserComment, UserDiscussion } from '../utils/GitLabUtils';
import { Resources } from '@gitbeaker/core';
import createContext from 'zustand/context';
import { ProjectSchema, UserSchema } from '@gitbeaker/core/dist/types/types';

export interface ExportStore {
  exportData: ExportData | null;
  projectsToExport: number[] | null;
  allProjects: ProjectSchema[] | null;
  export: (client: Resources.Gitlab) => Promise<void>;
  fetchProjects: (client: Resources.Gitlab) => Promise<void>;
  setProjectsToExport: (projectIds: number[]) => void;
}

export interface ExportData {
  users: UserSchema[];
  projects: ProjectExport[];
}

export interface ProjectExport {
  project: ProjectSchema;
  mergeRequests: MergeRequestSchema[];
  comments: UserComment[];
  discussions: UserDiscussion[];
}

const { Provider: ExportStoreProvider, useStore: useExportsStore } = createContext<StoreApi<ExportStore>>();
export { ExportStoreProvider, useExportsStore };

export function createExportStore() {
  return create<ExportStore>((set, get) => ({
    exportData: null,
    allProjects: null,
    projectsToExport: null,
    fetchProjects: async (client: Resources.Gitlab) => {
      const projects = await client.Projects.all({ perPage: 100 });
      set({ allProjects: projects });
    },
    setProjectsToExport: (ids: number[]) => {
      set({ projectsToExport: ids });
    },
    export: async (client: Resources.Gitlab) => {
      const projects = get().projectsToExport;
      if (projects == null || projects.length === 0) {
        return;
      }

      const users = await client.Users.all({ perPage: 100 });

      const allPromises = projects.map(async (projectId) => {
        const mergeRequests = await client.MergeRequests.all({
          projectId: projectId,
          createdAfter: new Date(0).toISOString(),
          createdBefore: new Date().toISOString(),
          perPage: 100,
        });

        const [comments, discussions] = await Promise.all([
          getUserComments(client, projectId, mergeRequests),
          getDiscussions(client, projectId, mergeRequests),
        ]);

        const project = (get().allProjects ?? []).find((item) => item.id === projectId)!;

        return {
          project,
          mergeRequests,
          comments,
          discussions,
        };
      });

      const allData = await Promise.all(allPromises);

      set({
        exportData: {
          users,
          projects: allData,
        },
      });
    },
  }));
}
