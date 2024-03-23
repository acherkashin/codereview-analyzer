import { ExportData } from '../utils/ExportDataUtils';
import { Credentials } from '../utils/UserContextUtils';
import { GiteaService } from './Gitea/GiteaService';
import { GitlabService } from './Gitlab/GitlabService';
import { AnalyzeParams, Project, User } from './types';

export function getGitService({ hostType, host, token }: Credentials): GitService {
  return hostType === 'Gitlab' ? new GitlabService(host, token) : new GiteaService(host, token);
}

export interface GitService {
  fetch(params: AnalyzeParams): Promise<ExportData>;

  getCurrentUser(): Promise<User>;
  searchUsers(searchText: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  searchProjects(searchText: string): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
}
