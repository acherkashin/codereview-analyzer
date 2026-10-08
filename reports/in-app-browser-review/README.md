# In-app browser UI review

Captured in the Codex in-app browser on 2026-10-08. The original screenshots are preserved beside the post-fix screenshots.

## Completed fixes

| Issue | Before | After |
| --- | --- | --- |
| Platform logo and name were stacked | `01-login-default-dark.jpg` | `after-01-login-default-dark.jpg` |
| Login card was clipped on short screens | `02-login-landscape-clipped.jpg`, `03-login-small-phone-clipped.jpg` | `after-02-login-landscape-scrollable.jpg`, `after-03-login-small-phone-scrollable.jpg` |
| Dark primary hover had insufficient contrast | `04-login-validation-dark.jpg` | `after-04-login-validation-hover-dark.jpg` |
| Gitea error remained after switching to GitLab | `05-stale-provider-error.jpg` | `after-05-provider-error-cleared.jpg` |
| Branch glyph was optically undersized | `07-dashboard-tile-icons-dark.jpg` | `after-07-dashboard-tile-icons-dark.jpg` |

## Reference views

- `06-dashboard-mobile-dark.jpg` and `after-06-dashboard-mobile-dark.jpg` show the dashboard before and after importing the same repository fixture.
- All post-fix captures were taken from the running local application, not generated mockups.

## Verification

- `npm run build` passed.
- `npx vitest run` passed (34 tests).
- `npm run test:e2e` passed (14 desktop/mobile browser tests).
