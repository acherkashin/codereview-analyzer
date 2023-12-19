import { User } from './types/User';
import { Client } from './types/Client';
import { Gitlab } from '@gitbeaker/browser';
import { Gitlab as GitlabType } from '@gitbeaker/core/dist/types';

export class GiteaClient implements Client {
  private api: GitlabType;

  constructor(private host: string, private token: string) {
    this.api = new Gitlab({
      token,
      host,
    });
  }

  getCurrentUser(): Promise<User> {
    return this.api.Users.current().then((user) => {
      return {
        id: user.id!.toString(),
        fullName: user.name!,
        // email: user.,
        avatarUrl: user.avatar_url!,
        webUrl: user.web_url,
      } as User;
    });
  }
}
