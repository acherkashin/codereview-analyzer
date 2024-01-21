import create, { StoreApi } from 'zustand';
import createContext from 'zustand/context';
import { Client, Project, PullRequest, User } from '../clients/types';
import { UserDiscussion } from '../utils/GitLabUtils';

export interface ExportStore {
  exportData: ExportData | null;
  projectsToExport: string[] | null;
  allProjects: Project[] | null;
  export: (client: Client) => Promise<void>;
  fetchProjects: (client: Client) => Promise<void>;
  setProjectsToExport: (projectIds: string[]) => void;
}

export interface ExportData {
  users: User[];
  projects: ProjectExport[];
}

export interface ProjectExport {
  project: Project;
  mergeRequests: PullRequest[];
  discussions: UserDiscussion[];
}

const { Provider: ExportStoreProvider, useStore: useExportsStore } = createContext<StoreApi<ExportStore>>();
export { ExportStoreProvider, useExportsStore };

export function createExportStore() {
  return create<ExportStore>((set, get) => ({
    exportData: null,
    allProjects: null,
    projectsToExport: null,
    fetchProjects: async (client: Client) => {
      const projects = await client.getAllProjects();
      set({ allProjects: projects });
    },
    setProjectsToExport: (ids: string[]) => {
      set({ projectsToExport: ids });
    },
    export: async (client: Client) => {
      const projects = get().projectsToExport;
      if (projects == null || projects.length === 0) {
        return;
      }

      const users = await client.getAllUsers();

      const allPromises = projects.map(async (projectId) => {
        const mergeRequests = await client.analyze({
          projectId: projectId,
          createdAfter: new Date(0),
          createdBefore: new Date(),
          owner: '',
          pullRequestCount: Number.MAX_VALUE,
        });

        //TODO: how to provide owner?
        // const [comments, discussions] = await Promise.all([
        //   client.analyze({
        //     projectId,
        //     createdAfter: new Date(0),
        //     createdBefore: new Date(),
        //     owner: '',
        //     pullRequestCount: Number.MAX_VALUE,
        //   }),
        //   [],
        //   // getDiscussions(client, projectId, mergeRequests),
        // ]);

        const project = (get().allProjects ?? []).find((item) => item.id === projectId)!;

        return {
          project,
          mergeRequests,
          discussions: [],
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
