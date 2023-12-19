import { Api, giteaApi } from 'gitea-js';
import { User } from './types/User';
import { Client } from './types/Client';

export class GiteaClient implements Client {
  private api: Api<any>;

  constructor(private host: string, private token: string) {
    this.api = giteaApi(this.host, {
      token: this.token, // generate one at https://gitea.example.com/user/settings/applications
    });
  }

  getCurrentUser(): Promise<User> {
    return this.api.user.userGetCurrent().then(({ data: user }) => {
      return {
        id: user.id!.toString(),
        fullName: user.full_name!,
        email: user.email!,
        avatarUrl: user.avatar_url!,
        webUrl: `${this.host}/${user.login}`,
      } as User;
    });
  }
}
