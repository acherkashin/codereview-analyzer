import create, { StoreApi } from 'zustand';
import createContext from 'zustand/context';
import { Project, PullRequest, User } from '../services/types';
import { GitService } from '../services/GitService';
import { convert } from '../services/GitConverter';

export interface ExportStore {
  exportData: ExportData | null;
  projectsToExport: string[] | null;
  allProjects: Project[] | null;
  export: (client: GitService) => Promise<void>;
  fetchProjects: (client: GitService) => Promise<void>;
  setProjectsToExport: (projectIds: string[]) => void;
}

interface ExportData {
  users: User[];
  projects: ProjectExport[];
}

export interface ProjectExport {
  project: Project;
  pullRequests: PullRequest[];
}

const { Provider: ExportStoreProvider, useStore: useExportsStore } = createContext<StoreApi<ExportStore>>();
export { ExportStoreProvider, useExportsStore };

export function createExportStore() {
  return create<ExportStore>((set, get) => ({
    exportData: null,
    allProjects: null,
    projectsToExport: null,
    fetchProjects: async (client: GitService) => {
      const projects = await client.getAllProjects();
      set({ allProjects: projects });
    },
    setProjectsToExport: (ids: string[]) => {
      set({ projectsToExport: ids });
    },
    export: async (client: GitService) => {
      const { projectsToExport, allProjects } = get();
      if (projectsToExport == null || projectsToExport.length === 0 || allProjects == null) {
        return;
      }

      const users = await client.getAllUsers();

      const projects = allProjects.filter((item) => projectsToExport.includes(item.id));

      const allPromises = projects.map(async (project) => {
        //TODO: we should not fetch users here
        const data = await client.fetch({
          project,
          createdAfter: new Date(0),
          createdBefore: new Date(),
          pullRequestCount: Number.MAX_VALUE,
        });

        const { pullRequests } = convert(data);

        return {
          project,
          pullRequests,
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
