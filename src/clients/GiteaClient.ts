import { Api, giteaApi } from 'gitea-js';
import { User } from './types/User';
import { Client } from './types/Client';
import { Comment } from './types/Comment';

const owner = '*';
const projectId = '*';

export class GiteaClient implements Client {
  private api: Api<any>;

  constructor(private host: string, private token: string) {
    this.api = giteaApi(this.host, {
      token: this.token, // generate one at https://gitea.example.com/user/settings/applications
    });
  }

  getCurrentUser(): Promise<User> {
    // this.getPullRequests();

    return this.api.user.userGetCurrent().then(({ data: user }) => {
      return {
        id: user.id!.toString(),
        name: user.full_name!,
        email: user.email!,
        avatarUrl: user.avatar_url!,
        webUrl: `${this.host}/${user.login}`,
      } as User;
    });
  }

  getPullRequests(params: any) {
    return Promise.resolve([]);

    // open -na Google\ Chrome --args --user-data-dir=/tmp/temporary-chrome-profile-dir --disable-web-security --disable-site-isolation-trials
    // get all orgs
    // get all repos
    // get all pull requests
    // or search /repos/search
    // this.api.orgs.orgListRepos(owner).then((data) => console.log(data));
    // this.api.repos
    //   .repoSearch({
    //     q: projectId,
    //   })
    //   .then((data) => console.log(data));
    // this.api.repos.repoGetPullRequest(owner, projectId, 21163).then((data) => console.log(data));
    // /repos/{owner}/{repo}/pulls/{index}/reviews
    // this.api.repos.repoListPullReviews(owner, projectId, 21163).then((data) => console.log(data));
    // /repos/{owner}/{repo}/pulls/{index}/reviews
    // this.api.repos.repoGetPullReviewComments(owner, projectId, 21163, 67588).then((data) => console.log(data));
  }

  async getComments(params: any): Promise<Comment[]> {
    const pullRequests = await this.api.repos.repoListPullRequests(owner, projectId, {
      state: 'all',
      sort: 'recentupdate',
      page: 1,
      limit: 100,
    });

    const commentsPromise = pullRequests.data.map((pr) => {
      return this.api.repos.repoListPullReviews(owner, projectId, pr.number!).then((reviews) => {
        const comments = reviews.data
          .filter((review) => (review.comments_count ?? 0) > 0)
          .map((review) => this.api.repos.repoGetPullReviewComments(owner, projectId, pr.number!, review.id!));

        return Promise.all(comments);
      });
    });

    const commentsResponse = await Promise.all(commentsPromise);

    const allComments = commentsResponse.flatMap((item) => item.flatMap((item) => item.data));
    console.log(allComments);

    return allComments.map<Comment>((item) => ({
      prAuthorId: 'alex',
      prAuthorName: 'alex',
      commentId: item.commit_id!,
      comment: item.body!,
      reviewerId: item.user?.id?.toString() ?? 'unknown',
      reviewerName: item.user?.full_name ?? 'unknown',
      pullRequestId: 'pullRequestId',
      pullRequestName: 'pullRequestName',
    }));
  }
}
