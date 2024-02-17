import create, { StoreApi } from 'zustand';
import createContext from 'zustand/context';
import { Client, Project, PullRequest, User } from '../clients/types';

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
      const { projectsToExport, allProjects } = get();
      if (projectsToExport == null || projectsToExport.length === 0 || allProjects == null) {
        return;
      }

      const users = await client.getAllUsers();

      const projects = allProjects.filter((item) => projectsToExport.includes(item.id));

      const allPromises = projects.map(async (project) => {
        const mergeRequests = await client.analyze({
          project,
          createdAfter: new Date(0),
          createdBefore: new Date(),
          pullRequestCount: Number.MAX_VALUE,
        });

        return {
          project,
          mergeRequests,
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
