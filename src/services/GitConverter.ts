import { ExportData } from '../utils/ExportDataUtils';
import { GiteaConverter } from './Gitea/GiteaConverter';
import { GitlabConverter } from './Gitlab/GitlabConverter';
import { PullRequest, RawData, User } from './types';

export interface GitConverter {
  convert(data: RawData): ConvertedData;
}

export interface ConvertedData {
  pullRequests: PullRequest[];
  users: User[];
}

export function convert({ hostType, hostUrl, data }: ExportData): ConvertedData {
  const client: GitConverter = hostType === 'Gitlab' ? new GitlabConverter() : new GiteaConverter(hostUrl);

  return client.convert(data);
}
