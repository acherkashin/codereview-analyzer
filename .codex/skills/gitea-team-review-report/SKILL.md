---
name: gitea-team-review-report
description: Generate offline single-page HTML Team Review reports from Gitea pull request data. Use when the user asks for a Gitea team review, review-collaboration report, reviewer-to-author matrix, retrospective report, or an offline report for a selected team and period.
---

# Gitea Team Review Report

## Workflow

Use `scripts/generate-gitea-team-review-report.mjs`. The script owns deterministic work: Gitea API fetching, user matching, data conversion, Team Review model building, avatar embedding, and offline HTML generation.

Before generating a report:

1. Require an explicit period. If the user did not provide both start and end dates, ask for them.
2. Require `GITEA_TOKEN` in the environment. Do not ask the user to paste the token into chat.
3. Resolve the team from the user's free-form team description.
4. Show the resolved users to the user and ask for explicit confirmation.
5. Generate the report only after the user confirms the team.

## Resolve Team Members

Run:

```bash
GITEA_TOKEN=... node .codex/skills/gitea-team-review-report/scripts/generate-gitea-team-review-report.mjs \
  resolve-users \
  --host https://gitea.example.com \
  --team "backend team: Alex, Maria, Dima"
```

Interpret the JSON result:

- `selectedUsers`: users with confident deterministic matches.
- `candidates`: ranked matches for each included term.
- `exclusions`: ranked matches for `except`, `excluding`, `without`, or `minus` terms.
- `hasAmbiguity`: true when any provided term is ambiguous or unmatched.
- `needsConfirmation`: always true.

When presenting matches, include login, display name, and profile URL. If `hasAmbiguity` is true, ask the user to choose or clarify before report generation.

## Generate Report

After confirmation, pass confirmed logins or ids through `--team-users`:

```bash
GITEA_TOKEN=... node .codex/skills/gitea-team-review-report/scripts/generate-gitea-team-review-report.mjs \
  report \
  --host https://gitea.example.com \
  --owner my-org \
  --repo my-repo \
  --team-users alice,bob,dima \
  --from 2026-04-01 \
  --to 2026-04-30 \
  --output reports/team-review-2026-04.html
```

Required report arguments:

- `--host`: Gitea host URL.
- `--owner`: repository owner or organization.
- `--repo`: repository name.
- `--team-users`: comma-separated confirmed Gitea logins, ids, or display names.
- `--from`: inclusive start date in `YYYY-MM-DD`.
- `--to`: inclusive end date in `YYYY-MM-DD`.

Optional arguments:

- `--output`: HTML output path. Defaults to `reports/gitea-team-review-OWNER-REPO-FROM-to-TO.html`.
- `--include-outside`: `true` by default. Use `false` to start the report focused only on selected-team authors.
- `--state`: Gitea pull request list state. Defaults to `all`.
- `--concurrency`: detail-fetch concurrency. Defaults to `4`.

The generated HTML must be shared as the deliverable. It embeds normalized data, avatars, CSS, and JavaScript, and must not require network requests when opened. Profile and pull request links may still point to Gitea for optional click-through.

## Report Contents

The report mirrors the app's Team Review page for Gitea data:

- Insights for team members, authored PRs, reviewed PRs, approvals, discussions, and comments.
- Reviewer-to-author relationship matrix.
- Matrix metric selector for PR reviews, approvals, and discussions started.
- Show-outside-team toggle.
- Relationship details with supporting pull requests.
- PR size summary using compact, medium, large, and very large tiers.
- Approval and discussion distribution by selected team member.
- Authored pull request list.
- Concise talking points derived from the received data.

## Validation

For script-only validation without Gitea network access, run:

```bash
node .codex/skills/gitea-team-review-report/scripts/generate-gitea-team-review-report.mjs self-test
```

For skill structure validation, run the skill-creator validator:

```bash
python3 /Users/cherkalexander/.codex/skills/.system/skill-creator/scripts/quick_validate.py .codex/skills/gitea-team-review-report
```
