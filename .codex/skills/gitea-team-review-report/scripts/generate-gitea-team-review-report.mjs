#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PAGE_SIZE = 50;
const DATASET_SCHEMA_VERSION = 1;
const HEARTBEAT_INTERVAL_MS = 15_000;
const SIZE_TIERS = ['compact', 'medium', 'large', 'veryLarge'];
const SIZE_TIER_LABELS = {
  compact: 'Compact',
  medium: 'Medium',
  large: 'Large',
  veryLarge: 'Very large',
};
const SIZE_TIER_RANGES = {
  compact: '0-150 lines',
  medium: '151-499 lines',
  large: '500-999 lines',
  veryLarge: '1000+ lines',
};

async function main() {
  const [command, ...argv] = process.argv.slice(2);

  try {
    if (command === 'resolve-users') {
      await runResolveUsers(parseArgs(argv));
      return;
    }

    if (command === 'fetch-data') {
      await runFetchData(parseArgs(argv));
      return;
    }

    if (command === 'report') {
      await runReport(parseArgs(argv));
      return;
    }

    if (command === 'inspect-data') {
      await runInspectData(parseArgs(argv));
      return;
    }

    if (command === 'extract') {
      await runExtract(parseArgs(argv));
      return;
    }

    if (command === 'analyze') {
      await runAnalyze(parseArgs(argv));
      return;
    }

    if (command === 'self-test') {
      await runSelfTests();
      return;
    }

    printUsage();
    process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

function printUsage() {
  console.error(`Usage:
  node generate-gitea-team-review-report.mjs resolve-users --host <url> --team <free-form team text>
  node generate-gitea-team-review-report.mjs fetch-data --host <url> --owner <owner> --repo <repo> --from YYYY-MM-DD --to YYYY-MM-DD [--data output.json]
  node generate-gitea-team-review-report.mjs report --data dataset.json --team-users <login,id,...> [--output report.html]
  node generate-gitea-team-review-report.mjs report --host <url> --owner <owner> --repo <repo> --team-users <login,id,...> --from YYYY-MM-DD --to YYYY-MM-DD [--output report.html]
  node generate-gitea-team-review-report.mjs inspect-data --data dataset.json
  node generate-gitea-team-review-report.mjs extract --data dataset.json --from YYYY-MM-DD --to YYYY-MM-DD [--team-users <login,id,...>] [--fields summary,prs,files]
  node generate-gitea-team-review-report.mjs analyze --data dataset.json --type sprint-trends|unit-tests [--team-users <login,id,...>]
  node generate-gitea-team-review-report.mjs self-test

Environment:
  GITEA_TOKEN is required for resolve-users, fetch-data, and direct report fetching.`);
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index++) {
    const item = argv[index];

    if (!item.startsWith('--')) {
      throw new Error(`Unexpected argument: ${item}`);
    }

    const eqIndex = item.indexOf('=');
    if (eqIndex !== -1) {
      args[item.slice(2, eqIndex)] = item.slice(eqIndex + 1);
      continue;
    }

    const key = item.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index++;
  }

  return args;
}

class ProgressReporter {
  constructor({ progressFile } = {}) {
    this.progressFile = progressFile ? String(progressFile) : null;
    this.startedAt = Date.now();
    this.lastStage = null;
    this.lastEvent = null;
    this.heartbeat = null;
  }

  async start(stage, message, details = {}) {
    this.startHeartbeat();
    await this.event('started', stage, message, details);
  }

  async stage(stage, message, details = {}) {
    await this.event('progress', stage, message, details);
  }

  async complete(message, details = {}) {
    this.stopHeartbeat();
    await this.event('completed', 'complete', message, {
      ...details,
      durationMs: Date.now() - this.startedAt,
    });
  }

  async fail(error, details = {}) {
    this.stopHeartbeat();
    await this.event('failed', this.lastStage ?? 'failed', error instanceof Error ? error.message : String(error), {
      ...details,
      durationMs: Date.now() - this.startedAt,
    });
  }

  async event(type, stage, message, details = {}) {
    this.lastStage = stage;
    const event = {
      type,
      stage,
      message,
      details,
      at: new Date().toISOString(),
      elapsedMs: Date.now() - this.startedAt,
    };
    this.lastEvent = event;

    const count = formatCount(details);
    const suffix = count ? ` ${count}` : '';
    process.stderr.write(`[${event.at}] ${stage}: ${message}${suffix}\n`);

    if (this.progressFile) {
      await fs.mkdir(path.dirname(this.progressFile), { recursive: true });
      await fs.appendFile(this.progressFile, `${JSON.stringify(event)}\n`, 'utf8');
    }
  }

  startHeartbeat() {
    if (this.heartbeat) {
      return;
    }

    this.heartbeat = setInterval(() => {
      const last = this.lastEvent;
      const stage = last?.stage ?? 'running';
      const message = last ? `still running: ${last.message}` : 'still running';
      const count = last ? formatCount(last.details) : '';
      const suffix = count ? ` ${count}` : '';
      process.stderr.write(`[${new Date().toISOString()}] heartbeat: ${stage} ${message}${suffix}\n`);
    }, HEARTBEAT_INTERVAL_MS);
    this.heartbeat.unref?.();
  }

  stopHeartbeat() {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
  }
}

function formatCount(details) {
  if (details?.completed != null && details?.total != null) {
    return `(${details.completed}/${details.total})`;
  }

  if (details?.fetched != null && details?.total != null) {
    return `(${details.fetched}/${details.total})`;
  }

  if (details?.count != null) {
    return `(${details.count})`;
  }

  return '';
}

async function runResolveUsers(args) {
  const token = requireToken();
  const host = requireString(args.host, '--host');
  const teamText = requireString(args.team, '--team');
  const users = await getAllUsers(host, token);
  const result = resolveTeamMembers(teamText, users, host);
  writeJson(result);
}

async function runReport(args) {
  const progress = new ProgressReporter({ progressFile: args['progress-file'] });
  const teamUsers = parseCsv(requireString(args['team-users'], '--team-users'));
  const includeOutside = args['include-outside'] == null ? true : parseBoolean(args['include-outside']);
  let dataset;
  let dataPath = args.data ? String(args.data) : null;

  try {
    await progress.start('report', 'preparing report');

    if (dataPath) {
      dataset = await readDataset(dataPath, progress);
    } else {
      const fetchResult = await fetchAndWriteDataset(args, progress);
      dataset = fetchResult.dataset;
      dataPath = fetchResult.dataPath;
    }

    const output = args.output ? String(args.output) : defaultReportPath(dataset.source.owner, dataset.source.repo, dataset.source.from, dataset.source.to);
    const reportData = buildReportDataFromDataset(dataset, teamUsers, includeOutside);
    await progress.stage('html', 'building compact HTML payload', {
      pullRequests: reportData.pullRequests.length,
      users: reportData.users.length,
    });
    const html = generateHtml(reportData);

    await progress.stage('html', 'writing HTML report', { output, bytes: Buffer.byteLength(html, 'utf8') });
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, html, 'utf8');

    const result = {
      status: 'completed',
      output,
      data: dataPath,
      pullRequests: dataset.pullRequests.length,
      users: dataset.users.length,
      selectedTeamMembers: reportData.selectedTeamMembers.map(toPublicUser),
    };
    await progress.complete('report generated', result);
    writeJson(result);
  } catch (error) {
    await progress.fail(error);
    throw error;
  }
}

async function runFetchData(args) {
  const progress = new ProgressReporter({ progressFile: args['progress-file'] });

  try {
    await progress.start('fetch-data', 'fetching reusable Gitea dataset');
    const result = await fetchAndWriteDataset(args, progress);
    const summary = {
      status: 'completed',
      data: result.dataPath,
      users: result.dataset.users.length,
      pullRequests: result.dataset.pullRequests.length,
      bytes: result.bytes,
      schemaVersion: result.dataset.schemaVersion,
      source: result.dataset.source,
    };
    await progress.complete('dataset written', summary);
    writeJson(summary);
  } catch (error) {
    await progress.fail(error);
    throw error;
  }
}

async function fetchAndWriteDataset(args, progress) {
  const token = requireToken();
  const host = requireString(args.host, '--host');
  const owner = requireString(args.owner, '--owner');
  const repo = requireString(args.repo, '--repo');
  const from = requireDateOnly(args.from, '--from');
  const to = requireDateOnly(args.to, '--to');
  const state = args.state ? String(args.state) : 'all';
  const concurrency = args.concurrency == null ? 4 : parsePositiveInteger(args.concurrency, '--concurrency');
  const dataPath = args.data ? String(args.data) : defaultDataPath(owner, repo, from, to);

  assertValidDateRange(from, to);

  await progress.stage('users', 'fetching users');
  const users = await getAllUsers(host, token, progress);
  await progress.stage('users', 'users fetched', { count: users.length });
  const rawPullRequests = await fetchGiteaPullRequestData({
    host,
    token,
    owner,
    repo,
    state,
    from,
    to,
    concurrency,
    progress,
  });
  await progress.stage('dataset', 'normalizing dataset', { pullRequests: rawPullRequests.length });
  const dataset = createCanonicalDataset({
    host,
    owner,
    repo,
    from,
    to,
    state,
    users,
    rawPullRequests,
  });
  await embedDatasetAvatars(dataset, token, progress);
  const json = `${JSON.stringify(dataset)}\n`;

  await progress.stage('dataset', 'writing dataset JSON', { output: dataPath, bytes: Buffer.byteLength(json, 'utf8') });
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, json, 'utf8');

  return {
    dataPath,
    dataset,
    bytes: Buffer.byteLength(json, 'utf8'),
  };
}

async function runInspectData(args) {
  const progress = new ProgressReporter({ progressFile: args['progress-file'] });
  try {
    await progress.start('inspect-data', 'inspecting dataset');
    const dataPath = requireString(args.data, '--data');
    const dataset = await readDataset(dataPath, progress);
    const stats = await fs.stat(dataPath);
    const usersWithAvatars = dataset.users.filter((user) => Boolean(user.avatarDataUrl)).length;
    const result = {
      status: 'completed',
      data: dataPath,
      bytes: stats.size,
      schemaVersion: dataset.schemaVersion,
      source: dataset.source,
      users: dataset.users.length,
      usersWithEmbeddedAvatars: usersWithAvatars,
      pullRequests: dataset.pullRequests.length,
      dateRange: getDatasetDateRange(dataset),
    };
    await progress.complete('dataset inspected', result);
    writeJson(result);
  } catch (error) {
    await progress.fail(error);
    throw error;
  }
}

async function runExtract(args) {
  const progress = new ProgressReporter({ progressFile: args['progress-file'] });
  try {
    await progress.start('extract', 'extracting small dataset slice');
    const dataset = await readDataset(requireString(args.data, '--data'), progress);
    const from = args.from ? requireDateOnly(args.from, '--from') : dataset.source.from;
    const to = args.to ? requireDateOnly(args.to, '--to') : dataset.source.to;
    assertValidDateRange(from, to);
    const teamUsers = args['team-users'] ? parseCsv(String(args['team-users'])) : [];
    const fields = new Set(parseCsv(args.fields ? String(args.fields) : 'summary,prs'));
    const filtered = filterDatasetPullRequests(dataset, { from, to, teamUsers });
    const selectedUserIds = new Set(resolveDatasetTeamUsers(teamUsers, dataset.users).map((user) => user.id));
    const output = {
      status: 'completed',
      source: dataset.source,
      filters: { from, to, teamUsers },
      summary: summarizeCanonicalPullRequests(filtered, selectedUserIds),
    };

    if (fields.has('prs')) {
      output.pullRequests = filtered.map(toExtractPullRequest);
    }

    if (fields.has('files')) {
      output.files = filtered.flatMap((pullRequest) =>
        pullRequest.changedFiles.map((file) => ({
          pullRequestId: pullRequest.id,
          pullRequestTitle: pullRequest.title,
          path: file.path,
          additions: file.additions,
          deletions: file.deletions,
        }))
      );
    }

    if (args.output) {
      const text = `${JSON.stringify(output, null, 2)}\n`;
      await fs.mkdir(path.dirname(String(args.output)), { recursive: true });
      await fs.writeFile(String(args.output), text, 'utf8');
      const result = { status: 'completed', output: String(args.output), bytes: Buffer.byteLength(text, 'utf8'), summary: output.summary };
      await progress.complete('slice extracted', result);
      writeJson(result);
      return;
    }

    await progress.complete('slice extracted', { pullRequests: filtered.length });
    writeJson(output);
  } catch (error) {
    await progress.fail(error);
    throw error;
  }
}

async function runAnalyze(args) {
  const progress = new ProgressReporter({ progressFile: args['progress-file'] });
  try {
    await progress.start('analyze', 'running deterministic analysis');
    const dataset = await readDataset(requireString(args.data, '--data'), progress);
    const type = requireString(args.type, '--type');
    const teamUsers = args['team-users'] ? parseCsv(String(args['team-users'])) : [];
    const selectedUsers = resolveDatasetTeamUsers(teamUsers, dataset.users);
    const selectedUserIds = new Set(selectedUsers.map((user) => user.id));

    if (type === 'sprint-trends') {
      const sprints = args.sprints == null ? 3 : parsePositiveInteger(args.sprints, '--sprints');
      const sprintDays = args['sprint-days'] == null ? 14 : parsePositiveInteger(args['sprint-days'], '--sprint-days');
      const result = {
        status: 'completed',
        type,
        source: dataset.source,
        teamUsers: selectedUsers.map(toPublicDatasetUser),
        sprints: analyzeSprintTrends(dataset, { sprints, sprintDays, selectedUserIds }),
      };
      await progress.complete('analysis completed', { type, sprints });
      writeJson(result);
      return;
    }

    if (type === 'unit-tests') {
      const result = {
        status: 'completed',
        type,
        source: dataset.source,
        teamUsers: selectedUsers.map(toPublicDatasetUser),
        analysis: analyzeUnitTests(dataset, { selectedUserIds }),
      };
      await progress.complete('analysis completed', { type, pullRequests: result.analysis.pullRequests });
      writeJson(result);
      return;
    }

    throw new Error(`Unsupported analysis type: ${type}`);
  } catch (error) {
    await progress.fail(error);
    throw error;
  }
}

function requireToken(env = process.env) {
  if (!env.GITEA_TOKEN) {
    throw new Error('GITEA_TOKEN environment variable is required');
  }

  return env.GITEA_TOKEN;
}

function requireString(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} is required`);
  }

  return value.trim();
}

function requireDateOnly(value, name) {
  const text = requireString(value, name);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${name} must use YYYY-MM-DD format`);
  }

  const timestamp = Date.parse(`${text}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp)) {
    throw new Error(`${name} is not a valid date`);
  }

  return text;
}

function parsePositiveInteger(value, name) {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

function parseBoolean(value) {
  const normalized = String(value).toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  throw new Error(`Expected boolean value, received: ${value}`);
}

function parseCsv(value) {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeHost(host) {
  return String(host).replace(/\/+$/, '');
}

function defaultReportPath(owner, repo, from, to) {
  return path.join('reports', `gitea-team-review-${owner}-${repo}-${from}-to-${to}.html`);
}

function defaultDataPath(owner, repo, from, to) {
  return path.join('reports', 'data', `gitea-${owner}-${repo}-${from}-to-${to}.json`);
}

function assertValidDateRange(from, to) {
  if (new Date(`${from}T00:00:00.000Z`).getTime() > new Date(`${to}T00:00:00.000Z`).getTime()) {
    throw new Error('--from must be before or equal to --to');
  }
}

async function readDataset(dataPath, progress = null) {
  await progress?.stage('dataset', 'reading dataset JSON', { data: dataPath });
  const text = await fs.readFile(dataPath, 'utf8');
  const dataset = JSON.parse(text);
  validateDataset(dataset);
  await progress?.stage('dataset', 'dataset loaded', {
    data: dataPath,
    users: dataset.users.length,
    pullRequests: dataset.pullRequests.length,
    bytes: Buffer.byteLength(text, 'utf8'),
  });
  return dataset;
}

function validateDataset(dataset) {
  if (!dataset || dataset.schemaVersion !== DATASET_SCHEMA_VERSION || !Array.isArray(dataset.users) || !Array.isArray(dataset.pullRequests)) {
    throw new Error(`Unsupported or invalid dataset. Expected schemaVersion ${DATASET_SCHEMA_VERSION}.`);
  }
}

async function giteaJson(host, token, apiPath, query = {}) {
  const url = new URL(`${normalizeHost(host)}/api/v1${apiPath}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value != null) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `token ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Gitea request failed (${response.status}) ${url.pathname}: ${body || response.statusText}`);
  }

  return response.json();
}

async function getAllPages(fetchPage, limit = PAGE_SIZE) {
  const all = [];

  for (let page = 1; ; page++) {
    const current = (await fetchPage(page, limit)) ?? [];
    all.push(...current);

    if (current.length < limit) {
      return all;
    }
  }
}

async function getAllUsers(host, token, progress = null) {
  return getAllPages(async (page, limit) => {
    const response = await giteaJson(host, token, '/users/search', { q: '', page, limit });
    await progress?.stage('users', 'fetched users page', { page, fetched: response.data?.length ?? 0 });
    return response.data ?? [];
  });
}

async function fetchGiteaPullRequestData({ host, token, owner, repo, state, from, to, concurrency, progress = null }) {
  await progress?.stage('pull-request-list', 'fetching pull request list');
  const pulls = await getAllPages((page, limit) => {
    progress?.stage('pull-request-list', 'fetching pull request page', { page }).catch(() => {});
    return giteaJson(host, token, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`, {
      state,
      sort: 'oldest',
      page,
      limit,
    });
  });
  const filteredPulls = pulls.filter((pullRequest) => {
    const isIncludedState = pullRequest.merged || pullRequest.state === 'open';
    return isIncludedState && isInDateRange(pullRequest.created_at, from, to);
  });
  await progress?.stage('pull-request-list', 'pull request list filtered', {
    fetched: pulls.length,
    total: filteredPulls.length,
    from,
    to,
  });

  let completed = 0;
  return runPool(
    filteredPulls.map((pullRequest) => async () => {
      const index = pullRequest.number;
      await progress?.stage('pull-request-details', 'fetching pull request details', {
        completed,
        total: filteredPulls.length,
        number: index,
        title: pullRequest.title,
      });
      const [reviews, timeline, files] = await Promise.all([
        getAllPages((page, limit) =>
          giteaJson(host, token, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${index}/reviews`, {
            page,
            limit,
          })
        ),
        getAllPages((page, limit) =>
          giteaJson(host, token, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${index}/timeline`, {
            page,
            limit,
          })
        ),
        getAllPages((page, limit) =>
          giteaJson(host, token, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${index}/files`, {
            page,
            limit,
          })
        ),
      ]);
      const reviewComments = (
        await runPool(
          reviews
            .filter((review) => (review.comments_count ?? 0) > 0)
            .map((review) => async () =>
              giteaJson(
                host,
                token,
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${index}/reviews/${review.id}/comments`
              )
            ),
          concurrency
        )
      ).flat();
      completed++;
      await progress?.stage('pull-request-details', 'pull request details fetched', {
        completed,
        total: filteredPulls.length,
        number: index,
        title: pullRequest.title,
        reviews: reviews.length,
        reviewComments: reviewComments.length,
        files: files.length,
      });

      return {
        projectName: repo,
        pullRequest,
        reviews,
        comments: reviewComments,
        timeline,
        files,
      };
    }),
    concurrency
  );
}

async function runPool(tasks, concurrency) {
  const results = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await tasks[currentIndex]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}

function isInDateRange(dateValue, from, to) {
  if (!dateValue) {
    return false;
  }

  const timestamp = new Date(dateValue).getTime();
  const fromTimestamp = new Date(`${from}T00:00:00.000Z`).getTime();
  const toTimestamp = new Date(`${to}T23:59:59.999Z`).getTime();

  return timestamp >= fromTimestamp && timestamp <= toTimestamp;
}

function resolveTeamMembers(teamText, rawUsers, host) {
  const users = rawUsers.map((user) => convertToUser(host, user));
  const candidates = extractCandidateTerms(teamText);
  const includedMatches = candidates.include.map((term) => resolveTerm(term, users));
  const excludedMatches = candidates.exclude.map((term) => resolveTerm(term, users));
  const excludedIds = new Set(
    excludedMatches
      .filter((match) => match.status === 'matched')
      .map((match) => match.matches[0].id)
  );
  const selectedUsersById = new Map();

  includedMatches.forEach((match) => {
    if (match.status === 'matched' && !excludedIds.has(match.matches[0].id)) {
      selectedUsersById.set(match.matches[0].id, match.matches[0]);
    }
  });

  return {
    input: teamText,
    extractedTerms: candidates,
    selectedUsers: [...selectedUsersById.values()],
    candidates: includedMatches,
    exclusions: excludedMatches,
    needsConfirmation: true,
    hasAmbiguity: includedMatches.length === 0 || includedMatches.some((match) => match.status !== 'matched'),
  };
}

function extractCandidateTerms(teamText) {
  const text = String(teamText).trim();
  const [includePart, excludePart = ''] = splitExclusions(text);
  const afterLabel = includePart.includes(':') ? includePart.slice(includePart.lastIndexOf(':') + 1) : includePart;

  return {
    include: splitTerms(afterLabel),
    exclude: splitTerms(excludePart),
  };
}

function splitExclusions(text) {
  const match = text.match(/\b(?:except|excluding|without|minus)\b/i);

  if (!match) {
    return [text, ''];
  }

  return [text.slice(0, match.index), text.slice(match.index + match[0].length)];
}

function splitTerms(text) {
  const normalized = text
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\band\b/gi, ',')
    .replace(/\+/g, ',');
  const parts = normalized
    .split(/[,;\n]/)
    .map((part) => part.trim().replace(/^[-*]\s*/, '').replace(/^@/, ''))
    .filter(Boolean)
    .filter((part) => !isOnlyStopWords(part));

  if (parts.length > 0) {
    return [...new Set(parts)];
  }

  return normalized
    .split(/\s+/)
    .map((part) => part.trim().replace(/^@/, ''))
    .filter((part) => part.length >= 2 && !STOP_WORDS.has(normalizeForMatch(part)));
}

const STOP_WORDS = new Set([
  'the',
  'team',
  'teams',
  'reviewer',
  'reviewers',
  'developer',
  'developers',
  'dev',
  'devs',
  'backend',
  'frontend',
  'mobile',
  'web',
  'qa',
  'and',
  'or',
]);

function isOnlyStopWords(value) {
  const words = normalizeForMatch(value).split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((word) => STOP_WORDS.has(word));
}

function resolveTerm(term, users) {
  const matches = users
    .map((user) => scoreUser(term, user))
    .filter((match) => match.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.displayName.localeCompare(right.displayName);
    })
    .slice(0, 5);
  const top = matches[0];
  const second = matches[1];
  let status = 'unmatched';

  if (top && top.score >= 90 && (!second || top.score - second.score >= 10)) {
    status = 'matched';
  } else if (top) {
    status = 'ambiguous';
  }

  return {
    term,
    status,
    matches,
  };
}

function scoreUser(term, user) {
  const normalizedTerm = normalizeForMatch(term);
  const login = normalizeForMatch(user.userName);
  const display = normalizeForMatch(user.displayName);
  const full = normalizeForMatch(user.fullName);
  const fields = [login, display, full].filter(Boolean);
  let score = 0;
  let reason = '';

  if (login === normalizedTerm) {
    score = 110;
    reason = 'exact login match';
  } else if (display === normalizedTerm || full === normalizedTerm) {
    score = 105;
    reason = 'exact display name match';
  } else if (fields.some((field) => field.split(/\s+/).includes(normalizedTerm))) {
    score = 92;
    reason = 'name word match';
  } else if (login.includes(normalizedTerm)) {
    score = 86;
    reason = 'login contains term';
  } else if (fields.some((field) => field.includes(normalizedTerm))) {
    score = 82;
    reason = 'name contains term';
  }

  return {
    id: user.id,
    login: user.userName,
    displayName: user.displayName,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    profileUrl: user.webUrl,
    score,
    reason,
  };
}

function normalizeForMatch(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._ -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveTeamUserArguments(values, rawUsers, host) {
  const users = rawUsers.map((user) => convertToUser(host, user));
  const usersByToken = new Map();

  users.forEach((user) => {
    usersByToken.set(normalizeForMatch(user.id), user);
    usersByToken.set(normalizeForMatch(user.userName), user);
    usersByToken.set(normalizeForMatch(user.displayName), user);
  });

  return values.map((value) => {
    const user = usersByToken.get(normalizeForMatch(value));

    if (!user) {
      throw new Error(`Unable to find confirmed team user: ${value}`);
    }

    return user;
  });
}

function convertToUser(host, user) {
  const id = String(user.id ?? user.login ?? user.email ?? 'unknown');
  const login = user.login || user.email || id;

  return {
    id,
    fullName: user.full_name || user.fullName || login,
    userName: login,
    displayName: user.full_name || user.fullName || login,
    avatarUrl: user.avatar_url || user.avatarUrl || '',
    webUrl: `${normalizeHost(host)}/${login}`,
    active: Boolean(user.active ?? true),
  };
}

function convertToPullRequest(host, { projectName, pullRequest: pr, reviews, comments, timeline, files }) {
  const notEmptyReviews = reviews.filter((item) => Boolean(item.body)).map((review) => convertToComment(pr, review));
  const prComments = comments.map((item) => convertToComment(pr, item));
  const discussions = convertToDiscussions(pr, comments);
  const diffStats = getDiffStats(files);
  const reviewedByUser = reviews
    .filter((item) => item.state && item.user && ['APPROVED', 'REQUEST_CHANGES', 'COMMENT'].includes(item.state))
    .map((item) => ({
      user: convertToUser(host, item.user),
      at: item.submitted_at,
      activityType: getActivityType(item.state),
    }));

  return {
    id: String(pr.id),
    title: pr.title ?? 'unknown title',
    repositoryName: projectName,
    targetBranch: pr.base?.label ?? 'unknown target branch',
    branchName: pr.head?.label ?? 'unknown branch name',
    url: pr.html_url ?? pr.url ?? '#',
    status: getPullRequestStatus(pr),
    updatedAt: pr.updated_at ?? 'unknown updated at',
    author: convertToUser(host, pr.user ?? {}),
    requestedReviewers: (pr.requested_reviewers ?? []).map((user) => convertToUser(host, user)),
    comments: [...notEmptyReviews, ...prComments],
    createdAt: pr.created_at ?? 'unknown created at',
    reviewedByUser,
    approvedByUser: reviews
      .filter((item) => item.state === 'APPROVED' && item.user)
      .map((item) => ({ user: convertToUser(host, item.user), at: item.submitted_at, activityType: 'approved' })),
    requestedChangesByUser: reviews
      .filter((item) => item.state === 'REQUEST_CHANGES' && item.user)
      .map((item) => ({ user: convertToUser(host, item.user), at: item.submitted_at, activityType: 'requested changes' })),
    mergedAt: pr.merged_at,
    discussions,
    readyAt: getReadyTime(pr, timeline),
    changedFilesCount: files?.length ?? 0,
    linesAdded: diffStats.linesAdded,
    linesRemoved: diffStats.linesRemoved,
    discussionCount: discussions.length,
    reviewCommentCount: notEmptyReviews.length + prComments.length,
  };
}

function convertToComment(pullRequest, item) {
  return {
    id: String(item.id),
    prAuthorId: String(pullRequest.user?.id ?? 'unknown authorId'),
    prAuthorName: pullRequest.user?.full_name || pullRequest.user?.login || 'unknown authorName',
    prAuthorAvatarUrl: pullRequest.user?.avatar_url,
    body: item.body ?? '',
    reviewerId: String(item.user?.id ?? 'unknown reviewerId'),
    reviewerName: item.user?.full_name || item.user?.login || 'unknown reviewerName',
    reviewerAvatarUrl: item.user?.avatar_url,
    pullRequestId: String(pullRequest.id),
    pullRequestName: pullRequest.title ?? 'unknown pull request',
    url: item.html_url ?? '#',
    filePath: 'path' in item ? item.path ?? '' : '',
    createdAt: 'created_at' in item ? item.created_at : item.submitted_at,
  };
}

function convertToDiscussions(pr, comments) {
  const groups = new Map();

  comments.forEach((comment) => {
    const key = [comment.pull_request_review_id, comment.path, comment.position].map((item) => item ?? '').join(':');
    const group = groups.get(key) ?? [];
    group.push(comment);
    groups.set(key, group);
  });

  return [...groups.values()].map((groupedComments) => {
    const convertedComments = groupedComments.map((item) => convertToComment(pr, item));
    const first = convertedComments[0];

    return {
      id: first.id,
      comments: convertedComments,
      prAuthorId: first.prAuthorId,
      prAuthorName: first.prAuthorName,
      reviewerId: first.reviewerId,
      reviewerName: first.reviewerName,
      reviewerAvatarUrl: first.reviewerAvatarUrl,
      pullRequestId: first.pullRequestId,
      pullRequestName: first.pullRequestName,
      pullRequestUrl: pr.html_url ?? pr.url ?? '#',
      url: first.url,
    };
  });
}

function createCanonicalDataset({ host, owner, repo, from, to, state, users, rawPullRequests }) {
  const normalizedHost = normalizeHost(host);
  return {
    schemaVersion: DATASET_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      host: normalizedHost,
      owner,
      repo,
      from,
      to,
      state,
    },
    users: users.map((user) => toDatasetUser(convertToUser(normalizedHost, user))),
    pullRequests: rawPullRequests.map((datum) => toCanonicalPullRequest(normalizedHost, datum)),
  };
}

function toDatasetUser(user) {
  return {
    id: user.id,
    login: user.userName,
    fullName: user.fullName,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    avatarDataUrl: user.avatarDataUrl,
    profileUrl: user.webUrl,
    active: user.active,
  };
}

function toCanonicalPullRequest(host, { projectName, pullRequest: pr, reviews, comments, timeline, files }) {
  const normalized = convertToPullRequest(host, { projectName, pullRequest: pr, reviews, comments, timeline, files });

  return {
    id: normalized.id,
    number: pr.number,
    title: normalized.title,
    repositoryName: normalized.repositoryName,
    targetBranch: normalized.targetBranch,
    branchName: normalized.branchName,
    url: normalized.url,
    status: normalized.status,
    authorId: normalized.author.id,
    requestedReviewerIds: normalized.requestedReviewers.map((user) => user.id),
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
    mergedAt: normalized.mergedAt,
    readyAt: normalized.readyAt,
    changedFilesCount: normalized.changedFilesCount,
    linesAdded: normalized.linesAdded,
    linesRemoved: normalized.linesRemoved,
    discussionCount: normalized.discussionCount,
    reviewCommentCount: normalized.reviewCommentCount,
    reviews: reviews.map((review) => ({
      id: String(review.id),
      userId: String(review.user?.id ?? 'unknown reviewerId'),
      state: review.state ?? '',
      body: review.body ?? '',
      submittedAt: review.submitted_at,
      url: review.html_url ?? '#',
      commentsCount: review.comments_count ?? 0,
    })),
    reviewComments: comments.map((comment) => ({
      id: String(comment.id),
      reviewId: comment.pull_request_review_id == null ? null : String(comment.pull_request_review_id),
      userId: String(comment.user?.id ?? 'unknown reviewerId'),
      body: comment.body ?? '',
      path: comment.path ?? '',
      position: comment.position ?? null,
      url: comment.html_url ?? '#',
      createdAt: comment.created_at,
    })),
    timeline: timeline
      .filter((item) => item.type === 'change_title')
      .map((item) => ({
        type: item.type,
        createdAt: item.created_at,
        oldTitle: item.old_title,
        newTitle: item.new_title,
      })),
    changedFiles: (files ?? []).map((file) => ({
      path: file.filename ?? file.path ?? '',
      additions: file.additions ?? 0,
      deletions: file.deletions ?? 0,
    })),
  };
}

function canonicalToPullRequest(dataset, canonicalPullRequest) {
  const usersById = new Map(dataset.users.map((user) => [user.id, datasetUserToAppUser(dataset.source.host, user)]));
  const author = usersById.get(canonicalPullRequest.authorId) ?? unknownUser(dataset.source.host, canonicalPullRequest.authorId);
  const requestedReviewers = canonicalPullRequest.requestedReviewerIds.map((id) => usersById.get(id) ?? unknownUser(dataset.source.host, id));
  const reviewActivities = canonicalPullRequest.reviews
    .filter((review) => review.state && ['APPROVED', 'REQUEST_CHANGES', 'COMMENT'].includes(review.state))
    .map((review) => ({
      user: usersById.get(review.userId) ?? unknownUser(dataset.source.host, review.userId),
      at: review.submittedAt,
      activityType: getActivityType(review.state),
    }));
  const approvedByUser = canonicalPullRequest.reviews
    .filter((review) => review.state === 'APPROVED')
    .map((review) => ({
      user: usersById.get(review.userId) ?? unknownUser(dataset.source.host, review.userId),
      at: review.submittedAt,
      activityType: 'approved',
    }));
  const requestedChangesByUser = canonicalPullRequest.reviews
    .filter((review) => review.state === 'REQUEST_CHANGES')
    .map((review) => ({
      user: usersById.get(review.userId) ?? unknownUser(dataset.source.host, review.userId),
      at: review.submittedAt,
      activityType: 'requested changes',
    }));
  const pullRequestBase = {
    id: canonicalPullRequest.id,
    title: canonicalPullRequest.title,
    repositoryName: canonicalPullRequest.repositoryName,
    branchName: canonicalPullRequest.branchName,
    url: canonicalPullRequest.url,
    targetBranch: canonicalPullRequest.targetBranch,
    status: canonicalPullRequest.status,
    author,
    requestedReviewers,
    reviewedByUser: reviewActivities,
    approvedByUser,
    requestedChangesByUser,
    updatedAt: canonicalPullRequest.updatedAt,
    createdAt: canonicalPullRequest.createdAt,
    mergedAt: canonicalPullRequest.mergedAt,
    readyAt: canonicalPullRequest.readyAt,
    changedFilesCount: canonicalPullRequest.changedFilesCount,
    linesAdded: canonicalPullRequest.linesAdded,
    linesRemoved: canonicalPullRequest.linesRemoved,
    discussionCount: canonicalPullRequest.discussionCount,
    reviewCommentCount: canonicalPullRequest.reviewCommentCount,
  };
  const reviewBodyComments = canonicalPullRequest.reviews
    .filter((review) => Boolean(review.body))
    .map((review) => canonicalReviewToComment(pullRequestBase, review, usersById));
  const reviewComments = canonicalPullRequest.reviewComments.map((comment) => canonicalReviewCommentToComment(pullRequestBase, comment, usersById));

  return {
    ...pullRequestBase,
    comments: [...reviewBodyComments, ...reviewComments],
    discussions: canonicalCommentsToDiscussions(pullRequestBase, canonicalPullRequest.reviewComments, usersById),
  };
}

function canonicalReviewToComment(pullRequest, review, usersById) {
  const reviewer = usersById.get(review.userId) ?? unknownUser('', review.userId);
  return {
    id: review.id,
    prAuthorId: pullRequest.author.id,
    prAuthorName: pullRequest.author.displayName,
    prAuthorAvatarUrl: pullRequest.author.avatarUrl,
    body: review.body,
    reviewerId: reviewer.id,
    reviewerName: reviewer.displayName,
    reviewerAvatarUrl: reviewer.avatarUrl,
    pullRequestId: pullRequest.id,
    pullRequestName: pullRequest.title,
    url: review.url,
    filePath: '',
    createdAt: review.submittedAt,
  };
}

function canonicalReviewCommentToComment(pullRequest, comment, usersById) {
  const reviewer = usersById.get(comment.userId) ?? unknownUser('', comment.userId);
  return {
    id: comment.id,
    prAuthorId: pullRequest.author.id,
    prAuthorName: pullRequest.author.displayName,
    prAuthorAvatarUrl: pullRequest.author.avatarUrl,
    body: comment.body,
    reviewerId: reviewer.id,
    reviewerName: reviewer.displayName,
    reviewerAvatarUrl: reviewer.avatarUrl,
    pullRequestId: pullRequest.id,
    pullRequestName: pullRequest.title,
    url: comment.url,
    filePath: comment.path,
    createdAt: comment.createdAt,
  };
}

function canonicalCommentsToDiscussions(pullRequest, comments, usersById) {
  const groups = new Map();
  comments.forEach((comment) => {
    const key = [comment.reviewId, comment.path, comment.position].map((item) => item ?? '').join(':');
    const group = groups.get(key) ?? [];
    group.push(comment);
    groups.set(key, group);
  });

  return [...groups.values()].map((groupedComments) => {
    const convertedComments = groupedComments.map((comment) => canonicalReviewCommentToComment(pullRequest, comment, usersById));
    const first = convertedComments[0];

    return {
      id: first.id,
      comments: convertedComments,
      prAuthorId: first.prAuthorId,
      prAuthorName: first.prAuthorName,
      reviewerId: first.reviewerId,
      reviewerName: first.reviewerName,
      reviewerAvatarUrl: first.reviewerAvatarUrl,
      pullRequestId: first.pullRequestId,
      pullRequestName: first.pullRequestName,
      pullRequestUrl: pullRequest.url,
      url: first.url,
    };
  });
}

function datasetUserToAppUser(host, user) {
  return {
    id: user.id,
    fullName: user.fullName,
    userName: user.login,
    displayName: user.displayName,
    avatarUrl: user.avatarDataUrl || user.avatarUrl || fallbackAvatarDataUri(user.displayName),
    webUrl: user.profileUrl || `${normalizeHost(host)}/${user.login}`,
    active: Boolean(user.active),
  };
}

function unknownUser(host, id) {
  return {
    id: String(id),
    fullName: String(id),
    userName: String(id),
    displayName: String(id),
    avatarUrl: fallbackAvatarDataUri(String(id)),
    webUrl: host ? `${normalizeHost(host)}/${id}` : '',
    active: true,
  };
}

function buildReportDataFromDataset(dataset, teamUsers, includeOutside) {
  const users = dataset.users.map((user) => datasetUserToAppUser(dataset.source.host, user));
  const selectedTeamMembers = resolveDatasetTeamUsers(teamUsers, dataset.users).map((user) => datasetUserToAppUser(dataset.source.host, user));
  const pullRequests = dataset.pullRequests.map((pullRequest) => compactPullRequestForReport(canonicalToPullRequest(dataset, pullRequest)));

  return {
    host: dataset.source.host,
    owner: dataset.source.owner,
    repo: dataset.source.repo,
    from: dataset.source.from,
    to: dataset.source.to,
    includeOutside,
    selectedTeamMembers,
    users,
    pullRequests,
    generatedAt: new Date().toISOString(),
    dataset: {
      schemaVersion: dataset.schemaVersion,
      generatedAt: dataset.generatedAt,
      pullRequests: dataset.pullRequests.length,
      users: dataset.users.length,
    },
  };
}

function compactPullRequestForReport(pullRequest) {
  return {
    id: pullRequest.id,
    title: pullRequest.title,
    repositoryName: pullRequest.repositoryName,
    branchName: pullRequest.branchName,
    url: pullRequest.url,
    targetBranch: pullRequest.targetBranch,
    status: pullRequest.status,
    author: pullRequest.author,
    requestedReviewers: pullRequest.requestedReviewers,
    reviewedByUser: pullRequest.reviewedByUser,
    approvedByUser: pullRequest.approvedByUser,
    requestedChangesByUser: pullRequest.requestedChangesByUser,
    updatedAt: pullRequest.updatedAt,
    createdAt: pullRequest.createdAt,
    mergedAt: pullRequest.mergedAt,
    readyAt: pullRequest.readyAt,
    changedFilesCount: pullRequest.changedFilesCount,
    linesAdded: pullRequest.linesAdded,
    linesRemoved: pullRequest.linesRemoved,
    discussionCount: pullRequest.discussionCount,
    reviewCommentCount: pullRequest.reviewCommentCount,
    comments: pullRequest.comments.map((comment) => ({
      id: comment.id,
      prAuthorId: comment.prAuthorId,
      prAuthorName: comment.prAuthorName,
      prAuthorAvatarUrl: comment.prAuthorAvatarUrl,
      reviewerId: comment.reviewerId,
      reviewerName: comment.reviewerName,
      reviewerAvatarUrl: comment.reviewerAvatarUrl,
      pullRequestId: comment.pullRequestId,
      pullRequestName: comment.pullRequestName,
      url: comment.url,
      filePath: comment.filePath,
      createdAt: comment.createdAt,
    })),
    discussions: pullRequest.discussions.map((discussion) => ({
      id: discussion.id,
      prAuthorId: discussion.prAuthorId,
      prAuthorName: discussion.prAuthorName,
      reviewerId: discussion.reviewerId,
      reviewerName: discussion.reviewerName,
      reviewerAvatarUrl: discussion.reviewerAvatarUrl,
      pullRequestId: discussion.pullRequestId,
      pullRequestName: discussion.pullRequestName,
      pullRequestUrl: discussion.pullRequestUrl,
      url: discussion.url,
      comments: discussion.comments.map((comment) => ({
        id: comment.id,
        reviewerId: comment.reviewerId,
        createdAt: comment.createdAt,
        pullRequestId: comment.pullRequestId,
        url: comment.url,
      })),
    })),
  };
}

function getActivityType(reviewState) {
  if (reviewState === 'APPROVED') {
    return 'approved';
  }

  if (reviewState === 'REQUEST_CHANGES') {
    return 'requested changes';
  }

  return 'comment';
}

function getReadyTime(pullRequest, timeline) {
  if (pullRequest.title?.trim().startsWith('WIP:')) {
    return undefined;
  }

  for (let index = timeline.length - 1; index >= 0; index--) {
    const item = timeline[index];
    if (
      item.type === 'change_title' &&
      item.old_title?.trim().startsWith('WIP:') &&
      !item.new_title?.trim().startsWith('WIP:')
    ) {
      return item.created_at;
    }
  }

  return pullRequest.created_at;
}

function getPullRequestStatus(pr) {
  if (pr.merged) {
    return 'merged';
  }

  if (pr.state === 'closed') {
    return 'closed';
  }

  return 'open';
}

function getDiffStats(files) {
  return (files ?? []).reduce(
    (total, file) => {
      total.linesAdded += file.additions ?? 0;
      total.linesRemoved += file.deletions ?? 0;
      return total;
    },
    { linesAdded: 0, linesRemoved: 0 }
  );
}

function buildTeamReviewModel(pullRequests, selectedTeamMembers, options = {}) {
  const includeOutsideTeamMembers = options.includeOutsideTeamMembers ?? true;
  const selectedTeamMembersById = new Map(uniqueUsersById(selectedTeamMembers).map((user) => [user.id, user]));
  const selectedTeamMemberIds = new Set(selectedTeamMembersById.keys());
  const relationships = new Map();
  const authoredPullRequests = pullRequests
    .filter((pullRequest) => selectedTeamMemberIds.has(pullRequest.author.id))
    .sort(sortPullRequestsByCreatedDesc);

  pullRequests.forEach((pullRequest) => {
    const isAuthorSelectedTeamMember = selectedTeamMemberIds.has(pullRequest.author.id);

    if (!includeOutsideTeamMembers && !isAuthorSelectedTeamMember) {
      return;
    }

    selectedTeamMembersById.forEach((reviewer) => {
      if (pullRequest.author.id === reviewer.id) {
        return;
      }

      const activity = getReviewerActivityForPullRequest(pullRequest, reviewer.id);

      if (!activity.hasCapturedActivity) {
        return;
      }

      const key = getRelationshipId(reviewer.id, pullRequest.author.id);
      const relationship =
        relationships.get(key) ?? createRelationship(reviewer, pullRequest.author, isAuthorSelectedTeamMember);

      relationship.pullRequestsById.set(pullRequest.id, pullRequest);

      if (activity.approvedPullRequest) {
        relationship.approvalPullRequestIds.add(pullRequest.id);
      }

      activity.discussionIds.forEach((discussionId) => relationship.discussionIds.add(discussionId));
      activity.commentIds.forEach((commentId) => relationship.commentIds.add(commentId));
      relationships.set(key, relationship);
    });
  });

  const relationshipRows = [...relationships.entries()]
    .map(([id, relationship]) => ({
      id,
      reviewer: relationship.reviewer,
      author: relationship.author,
      isAuthorSelectedTeamMember: relationship.isAuthorSelectedTeamMember,
      reviewedPullRequestsCount: relationship.pullRequestsById.size,
      approvalsCount: relationship.approvalPullRequestIds.size,
      discussionsStartedCount: relationship.discussionIds.size,
      commentsCount: relationship.commentIds.size,
      pullRequests: [...relationship.pullRequestsById.values()].sort(sortPullRequestsByCreatedDesc),
    }))
    .sort(sortRelationships);
  const selectedTeamMembersList = [...selectedTeamMembersById.values()];

  return {
    selectedTeamMembers: selectedTeamMembersList,
    authoredPullRequests,
    relationships: relationshipRows,
    summary: buildTeamReviewSummary(authoredPullRequests, relationshipRows, selectedTeamMembersById.size),
    approvalShare: buildShareData(selectedTeamMembersList, relationshipRows, 'approvalsCount'),
    discussionShare: buildShareData(selectedTeamMembersList, relationshipRows, 'discussionsStartedCount'),
  };
}

function getRelationshipId(reviewerId, authorId) {
  return `${reviewerId}->${authorId}`;
}

function getReviewerActivityForPullRequest(pullRequest, reviewerId) {
  const reviewActivities = pullRequest.reviewedByUser.filter((activity) => activity.user.id === reviewerId);
  const requestedChanges = pullRequest.requestedChangesByUser.filter((activity) => activity.user.id === reviewerId);
  const approvedPullRequest = pullRequest.approvedByUser.some((activity) => activity.user.id === reviewerId);
  const discussionsStarted = pullRequest.discussions.filter((discussion) => discussion.reviewerId === reviewerId);
  const comments = getUniqueReviewerComments(pullRequest, reviewerId);

  return {
    hasCapturedActivity:
      reviewActivities.length > 0 ||
      requestedChanges.length > 0 ||
      approvedPullRequest ||
      discussionsStarted.length > 0 ||
      comments.length > 0,
    approvedPullRequest,
    discussionIds: discussionsStarted.map((discussion) => discussion.id),
    commentIds: comments.map(getCommentKey),
  };
}

function getUniqueReviewerComments(pullRequest, reviewerId) {
  const commentsById = new Map();
  const allComments = [...pullRequest.comments, ...pullRequest.discussions.flatMap((discussion) => discussion.comments)];

  allComments.forEach((comment) => {
    if (comment.reviewerId === reviewerId) {
      commentsById.set(getCommentKey(comment), comment);
    }
  });

  return [...commentsById.values()];
}

function getCommentKey(comment) {
  return comment.id || `${comment.pullRequestId}:${comment.url}:${comment.createdAt}:${comment.body}`;
}

function createRelationship(reviewer, author, isAuthorSelectedTeamMember) {
  return {
    reviewer,
    author,
    isAuthorSelectedTeamMember,
    pullRequestsById: new Map(),
    approvalPullRequestIds: new Set(),
    discussionIds: new Set(),
    commentIds: new Set(),
  };
}

function buildTeamReviewSummary(authoredPullRequests, relationships, teamMembersCount) {
  const sizeTierCounts = authoredPullRequests.reduce(
    (counts, pullRequest) => {
      counts[getPullRequestSizeTier(pullRequest)] += 1;
      return counts;
    },
    { compact: 0, medium: 0, large: 0, veryLarge: 0 }
  );
  const reviewedPullRequestIds = new Set();
  relationships.forEach((relationship) => {
    relationship.pullRequests.forEach((pullRequest) => reviewedPullRequestIds.add(pullRequest.id));
  });

  return {
    teamMembersCount,
    authoredPullRequestsCount: authoredPullRequests.length,
    reviewedPullRequestsCount: reviewedPullRequestIds.size,
    approvalsCount: relationships.reduce((total, relationship) => total + relationship.approvalsCount, 0),
    discussionsStartedCount: relationships.reduce((total, relationship) => total + relationship.discussionsStartedCount, 0),
    commentsCount: relationships.reduce((total, relationship) => total + relationship.commentsCount, 0),
    sizeTierCounts,
  };
}

function buildShareData(selectedTeamMembers, relationships, metric) {
  return selectedTeamMembers
    .map((user) => ({
      id: user.displayName,
      label: user.displayName,
      value: relationships
        .filter((relationship) => relationship.reviewer.id === user.id)
        .reduce((total, relationship) => total + relationship[metric], 0),
      userId: user.id,
    }))
    .sort((left, right) => {
      if (right.value !== left.value) {
        return right.value - left.value;
      }

      return left.label.localeCompare(right.label);
    });
}

function sortRelationships(left, right) {
  if (right.reviewedPullRequestsCount !== left.reviewedPullRequestsCount) {
    return right.reviewedPullRequestsCount - left.reviewedPullRequestsCount;
  }

  if (right.commentsCount !== left.commentsCount) {
    return right.commentsCount - left.commentsCount;
  }

  return `${left.reviewer.displayName}-${left.author.displayName}`.localeCompare(`${right.reviewer.displayName}-${right.author.displayName}`);
}

function uniqueUsersById(users) {
  const usersById = new Map();
  users.forEach((user) => usersById.set(user.id, user));
  return [...usersById.values()];
}

function sortPullRequestsByCreatedDesc(left, right) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function getPullRequestSize(pullRequest) {
  return pullRequest.linesAdded + pullRequest.linesRemoved;
}

function getPullRequestSizeTier(pullRequest) {
  const size = getPullRequestSize(pullRequest);

  if (size <= 150) {
    return 'compact';
  }

  if (size <= 499) {
    return 'medium';
  }

  if (size <= 999) {
    return 'large';
  }

  return 'veryLarge';
}

async function embedReportAvatars(reportData, token) {
  const users = collectUsers(reportData);
  const avatarByKey = new Map();

  await runPool(
    users.map((user) => async () => {
      avatarByKey.set(user.id, await avatarToDataUri(user, token));
    }),
    8
  );

  applyAvatarMap(reportData, avatarByKey);
  return reportData;
}

async function embedDatasetAvatars(dataset, token, progress = null) {
  let completed = 0;
  await progress?.stage('avatars', 'embedding user avatars', { completed, total: dataset.users.length });
  await runPool(
    dataset.users.map((user) => async () => {
      user.avatarDataUrl = await avatarToDataUri(
        {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        token
      );
      completed++;
      await progress?.stage('avatars', 'embedded avatar', { completed, total: dataset.users.length, user: user.login });
    }),
    8
  );
}

function collectUsers(reportData) {
  const usersById = new Map();
  const addUser = (user) => {
    if (user?.id) {
      usersById.set(user.id, user);
    }
  };

  reportData.users.forEach(addUser);
  reportData.selectedTeamMembers.forEach(addUser);
  reportData.pullRequests.forEach((pullRequest) => {
    addUser(pullRequest.author);
    pullRequest.requestedReviewers.forEach(addUser);
    pullRequest.reviewedByUser.forEach((activity) => addUser(activity.user));
    pullRequest.approvedByUser.forEach((activity) => addUser(activity.user));
    pullRequest.requestedChangesByUser.forEach((activity) => addUser(activity.user));
  });

  return [...usersById.values()];
}

async function avatarToDataUri(user, token) {
  if (!user.avatarUrl || !/^https?:\/\//.test(user.avatarUrl)) {
    return fallbackAvatarDataUri(user.displayName);
  }

  try {
    const response = await fetch(user.avatarUrl, {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    if (!response.ok) {
      return fallbackAvatarDataUri(user.displayName);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return fallbackAvatarDataUri(user.displayName);
  }
}

function fallbackAvatarDataUri(name) {
  const initials = String(name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#293164"/><text x="48" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#fff">${escapeXml(initials)}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function applyAvatarMap(reportData, avatarByKey) {
  const apply = (user) => {
    if (user?.id && avatarByKey.has(user.id)) {
      user.avatarUrl = avatarByKey.get(user.id);
    }
  };

  reportData.users.forEach(apply);
  reportData.selectedTeamMembers.forEach(apply);
  reportData.pullRequests.forEach((pullRequest) => {
    apply(pullRequest.author);
    pullRequest.requestedReviewers.forEach(apply);
    pullRequest.reviewedByUser.forEach((activity) => apply(activity.user));
    pullRequest.approvedByUser.forEach((activity) => apply(activity.user));
    pullRequest.requestedChangesByUser.forEach((activity) => apply(activity.user));
    pullRequest.comments.forEach((comment) => {
      comment.prAuthorAvatarUrl = avatarByKey.get(comment.prAuthorId) ?? fallbackAvatarDataUri(comment.prAuthorName);
      comment.reviewerAvatarUrl = avatarByKey.get(comment.reviewerId) ?? fallbackAvatarDataUri(comment.reviewerName);
    });
    pullRequest.discussions.forEach((discussion) => {
      discussion.reviewerAvatarUrl = avatarByKey.get(discussion.reviewerId) ?? fallbackAvatarDataUri(discussion.reviewerName);
      discussion.comments.forEach((comment) => {
        comment.prAuthorAvatarUrl = avatarByKey.get(comment.prAuthorId) ?? fallbackAvatarDataUri(comment.prAuthorName);
        comment.reviewerAvatarUrl = avatarByKey.get(comment.reviewerId) ?? fallbackAvatarDataUri(comment.reviewerName);
      });
    });
  });
}

function generateHtml(reportData) {
  const serializedData = JSON.stringify(reportData).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gitea Team Review Report</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7fb;
      --surface: #ffffff;
      --surface-soft: #f8fafc;
      --border: #e5e7eb;
      --text: #121828;
      --muted: #64748b;
      --primary: #5048e5;
      --primary-dark: #293164;
      --shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }
    a { color: var(--primary); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .page { max-width: 1480px; margin: 0 auto; padding: 24px; }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      margin: -24px -24px 24px;
      padding: 14px 24px;
      background: rgba(246, 247, 251, 0.94);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
    }
    .controls {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(2, minmax(160px, 220px)) minmax(260px, 1fr) auto auto;
      align-items: end;
    }
    label { display: grid; gap: 5px; color: var(--muted); font-size: 12px; font-weight: 700; text-transform: uppercase; }
    input, select {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      padding: 10px 12px;
      font: inherit;
      text-transform: none;
    }
    .toggle { display: flex; align-items: center; gap: 8px; padding-bottom: 8px; color: var(--text); font-weight: 600; text-transform: none; }
    .toggle input { width: auto; }
    .title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
    h1, h2, h3 { margin: 0; line-height: 1.1; }
    h1 { font-size: clamp(28px, 4vw, 44px); letter-spacing: 0; }
    h2 { font-size: 20px; margin-bottom: 8px; }
    h3 { font-size: 16px; margin-bottom: 8px; }
    .subtitle { color: var(--muted); margin: 8px 0 0; }
    .meta { color: var(--muted); font-size: 13px; text-align: right; }
    .section { margin: 24px 0; }
    .grid { display: grid; gap: 16px; }
    .insights { grid-template-columns: repeat(6, minmax(120px, 1fr)); }
    .cards-3 { grid-template-columns: minmax(280px, 0.8fr) repeat(2, minmax(280px, 1fr)); align-items: stretch; }
    .main-grid { grid-template-columns: minmax(0, 1.85fr) minmax(340px, 0.85fr); align-items: stretch; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 18px;
    }
    .insight {
      background: var(--primary-dark);
      color: #fff;
      border-radius: 8px;
      padding: 18px;
      min-height: 94px;
    }
    .insight .label { color: rgba(255,255,255,0.74); font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .insight .value { margin-top: 6px; font-size: 30px; font-weight: 800; }
    .team-list { display: flex; flex-wrap: wrap; gap: 8px; max-height: 92px; overflow: auto; padding: 2px; }
    .team-pill { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 999px; padding: 5px 10px 5px 5px; background: var(--surface); font-size: 13px; font-weight: 700; }
    .team-pill input { width: auto; }
    .avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; background: #d8def7; flex: 0 0 auto; }
    .avatar.small { width: 24px; height: 24px; }
    .avatar.large { width: 42px; height: 42px; }
    .matrix-wrap { overflow: auto; border: 1px solid var(--border); border-radius: 8px; max-height: 640px; }
    table { border-collapse: separate; border-spacing: 0; width: 100%; }
    th, td { border-bottom: 1px solid var(--border); border-right: 1px solid var(--border); padding: 8px; vertical-align: middle; background: var(--surface); }
    th:first-child, td:first-child { position: sticky; left: 0; z-index: 2; }
    th { position: sticky; top: 0; z-index: 3; font-size: 12px; color: var(--muted); }
    th:first-child { z-index: 4; }
    tr:last-child td { border-bottom: 0; }
    .person { display: flex; align-items: center; gap: 9px; min-width: 0; }
    .person-name { font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .person-sub { color: var(--muted); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .column-person { display: grid; justify-items: center; gap: 5px; min-width: 118px; }
    .outside { display: inline-block; border: 1px solid var(--border); border-radius: 999px; padding: 1px 7px; color: var(--muted); font-size: 11px; }
    .cell-button {
      width: 100%;
      min-height: 48px;
      border: 1px solid transparent;
      border-radius: 8px;
      font: inherit;
      font-weight: 900;
      cursor: pointer;
      transition: box-shadow 120ms ease, border-color 120ms ease;
    }
    .cell-button:hover, .cell-button.selected { border-color: var(--primary); box-shadow: 0 2px 8px rgba(80, 72, 229, 0.24); }
    .empty-cell { color: var(--muted); background: #fcfcfd; text-align: center; }
    .self-cell { color: var(--muted); background: var(--surface-soft); text-align: center; font-weight: 800; }
    .metric-row { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid var(--border); }
    .metric-row:last-child { border-bottom: 0; }
    .muted { color: var(--muted); }
    .bar-row { display: grid; grid-template-columns: minmax(140px, 0.8fr) minmax(140px, 1fr) 44px; gap: 10px; align-items: center; margin: 10px 0; }
    .bar-track { height: 12px; border-radius: 999px; background: #eef2ff; overflow: hidden; }
    .bar { height: 100%; border-radius: 999px; background: var(--primary); }
    .pr-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
    .pr-item { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface-soft); }
    .tag { display: inline-flex; border-radius: 999px; padding: 2px 8px; background: #eef2ff; color: #3730a3; font-size: 12px; font-weight: 800; }
    .talking-points { margin: 0; padding-left: 20px; }
    .talking-points li { margin: 8px 0; }
    .empty { color: var(--muted); padding: 16px; border: 1px dashed var(--border); border-radius: 8px; background: var(--surface-soft); }
    @media (max-width: 1100px) {
      .controls, .main-grid, .cards-3, .insights { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 720px) {
      .page { padding: 16px; }
      .topbar { margin: -16px -16px 16px; padding: 12px 16px; }
      .controls, .main-grid, .cards-3, .insights { grid-template-columns: 1fr; }
      .title-row { display: block; }
      .meta { text-align: left; margin-top: 12px; }
    }
  </style>
</head>
<body>
  <main class="page">
    <div class="topbar">
      <div class="controls">
        <label>Created After<input id="fromDate" type="date"></label>
        <label>Created Before<input id="toDate" type="date"></label>
        <label>Team members<div id="teamControls" class="team-list"></div></label>
        <label>Matrix metric<select id="metric"><option value="reviewedPullRequestsCount">PR reviews</option><option value="approvalsCount">Approvals</option><option value="discussionsStartedCount">Discussions started</option></select></label>
        <label class="toggle"><input id="includeOutside" type="checkbox"> Show outside team</label>
      </div>
    </div>

    <section class="title-row">
      <div>
        <h1>Team Review</h1>
        <p class="subtitle">Review team collaboration, review coverage, and authored pull request shape for the selected period.</p>
      </div>
      <div class="meta">
        <div><strong id="repoLabel"></strong></div>
        <div id="periodLabel"></div>
        <div id="generatedLabel"></div>
      </div>
    </section>

    <section class="section">
      <h2>Insights</h2>
      <p class="subtitle">Snapshot of authored work and directional review activity for the selected team.</p>
      <div id="insights" class="grid insights"></div>
    </section>

    <section class="section grid main-grid">
      <div class="card">
        <h2>Review relationships</h2>
        <div id="matrix"></div>
      </div>
      <div id="relationshipDetails" class="card"></div>
    </section>

    <section class="section grid cards-3">
      <div id="sizeSummary" class="card"></div>
      <div id="approvalShare" class="card"></div>
      <div id="discussionShare" class="card"></div>
    </section>

    <section class="section grid main-grid">
      <div id="authoredPullRequests" class="card"></div>
      <div id="talkingPoints" class="card"></div>
    </section>
  </main>

  <script>
    const REPORT_DATA = ${serializedData};
    const SIZE_TIERS = ${JSON.stringify(SIZE_TIERS)};
    const SIZE_TIER_LABELS = ${JSON.stringify(SIZE_TIER_LABELS)};
    const SIZE_TIER_RANGES = ${JSON.stringify(SIZE_TIER_RANGES)};
    const state = {
      from: REPORT_DATA.from,
      to: REPORT_DATA.to,
      includeOutside: REPORT_DATA.includeOutside,
      metric: 'reviewedPullRequestsCount',
      selectedTeamMemberIds: new Set(REPORT_DATA.selectedTeamMembers.map(function(user) { return user.id; })),
      selectedRelationshipId: null
    };

    function escapeHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatDate(value) {
      if (!value) return '';
      return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    }

    function isInDateRange(value, from, to) {
      const timestamp = new Date(value).getTime();
      const fromTimestamp = new Date(from + 'T00:00:00.000Z').getTime();
      const toTimestamp = new Date(to + 'T23:59:59.999Z').getTime();
      return timestamp >= fromTimestamp && timestamp <= toTimestamp;
    }

    function getRelationshipId(reviewerId, authorId) {
      return reviewerId + '->' + authorId;
    }

    function sortPullRequestsByCreatedDesc(left, right) {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    function getPullRequestSizeTier(pullRequest) {
      const size = pullRequest.linesAdded + pullRequest.linesRemoved;
      if (size <= 150) return 'compact';
      if (size <= 499) return 'medium';
      if (size <= 999) return 'large';
      return 'veryLarge';
    }

    function buildTeamReviewModel(pullRequests, selectedTeamMembers, includeOutsideTeamMembers) {
      const selectedTeamMembersById = new Map(selectedTeamMembers.map(function(user) { return [user.id, user]; }));
      const selectedTeamMemberIds = new Set(selectedTeamMembersById.keys());
      const relationships = new Map();
      const authoredPullRequests = pullRequests
        .filter(function(pullRequest) { return selectedTeamMemberIds.has(pullRequest.author.id); })
        .sort(sortPullRequestsByCreatedDesc);

      pullRequests.forEach(function(pullRequest) {
        const isAuthorSelectedTeamMember = selectedTeamMemberIds.has(pullRequest.author.id);
        if (!includeOutsideTeamMembers && !isAuthorSelectedTeamMember) return;

        selectedTeamMembersById.forEach(function(reviewer) {
          if (pullRequest.author.id === reviewer.id) return;
          const activity = getReviewerActivityForPullRequest(pullRequest, reviewer.id);
          if (!activity.hasCapturedActivity) return;
          const key = getRelationshipId(reviewer.id, pullRequest.author.id);
          const relationship = relationships.get(key) || {
            reviewer: reviewer,
            author: pullRequest.author,
            isAuthorSelectedTeamMember: isAuthorSelectedTeamMember,
            pullRequestsById: new Map(),
            approvalPullRequestIds: new Set(),
            discussionIds: new Set(),
            commentIds: new Set()
          };
          relationship.pullRequestsById.set(pullRequest.id, pullRequest);
          if (activity.approvedPullRequest) relationship.approvalPullRequestIds.add(pullRequest.id);
          activity.discussionIds.forEach(function(id) { relationship.discussionIds.add(id); });
          activity.commentIds.forEach(function(id) { relationship.commentIds.add(id); });
          relationships.set(key, relationship);
        });
      });

      const relationshipRows = Array.from(relationships.entries()).map(function(entry) {
        const id = entry[0];
        const relationship = entry[1];
        return {
          id: id,
          reviewer: relationship.reviewer,
          author: relationship.author,
          isAuthorSelectedTeamMember: relationship.isAuthorSelectedTeamMember,
          reviewedPullRequestsCount: relationship.pullRequestsById.size,
          approvalsCount: relationship.approvalPullRequestIds.size,
          discussionsStartedCount: relationship.discussionIds.size,
          commentsCount: relationship.commentIds.size,
          pullRequests: Array.from(relationship.pullRequestsById.values()).sort(sortPullRequestsByCreatedDesc)
        };
      }).sort(sortRelationships);
      const selectedTeamMembersList = Array.from(selectedTeamMembersById.values());

      return {
        selectedTeamMembers: selectedTeamMembersList,
        authoredPullRequests: authoredPullRequests,
        relationships: relationshipRows,
        summary: buildTeamReviewSummary(authoredPullRequests, relationshipRows, selectedTeamMembersById.size),
        approvalShare: buildShareData(selectedTeamMembersList, relationshipRows, 'approvalsCount'),
        discussionShare: buildShareData(selectedTeamMembersList, relationshipRows, 'discussionsStartedCount')
      };
    }

    function getReviewerActivityForPullRequest(pullRequest, reviewerId) {
      const reviewActivities = pullRequest.reviewedByUser.filter(function(activity) { return activity.user.id === reviewerId; });
      const requestedChanges = pullRequest.requestedChangesByUser.filter(function(activity) { return activity.user.id === reviewerId; });
      const approvedPullRequest = pullRequest.approvedByUser.some(function(activity) { return activity.user.id === reviewerId; });
      const discussionsStarted = pullRequest.discussions.filter(function(discussion) { return discussion.reviewerId === reviewerId; });
      const comments = getUniqueReviewerComments(pullRequest, reviewerId);
      return {
        hasCapturedActivity: reviewActivities.length > 0 || requestedChanges.length > 0 || approvedPullRequest || discussionsStarted.length > 0 || comments.length > 0,
        approvedPullRequest: approvedPullRequest,
        discussionIds: discussionsStarted.map(function(discussion) { return discussion.id; }),
        commentIds: comments.map(getCommentKey)
      };
    }

    function getUniqueReviewerComments(pullRequest, reviewerId) {
      const commentsById = new Map();
      pullRequest.comments.concat(pullRequest.discussions.flatMap(function(discussion) { return discussion.comments; })).forEach(function(comment) {
        if (comment.reviewerId === reviewerId) commentsById.set(getCommentKey(comment), comment);
      });
      return Array.from(commentsById.values());
    }

    function getCommentKey(comment) {
      return comment.id || comment.pullRequestId + ':' + comment.url + ':' + comment.createdAt + ':' + comment.body;
    }

    function buildTeamReviewSummary(authoredPullRequests, relationships, teamMembersCount) {
      const sizeTierCounts = { compact: 0, medium: 0, large: 0, veryLarge: 0 };
      authoredPullRequests.forEach(function(pullRequest) { sizeTierCounts[getPullRequestSizeTier(pullRequest)] += 1; });
      const reviewedPullRequestIds = new Set();
      relationships.forEach(function(relationship) {
        relationship.pullRequests.forEach(function(pullRequest) { reviewedPullRequestIds.add(pullRequest.id); });
      });
      return {
        teamMembersCount: teamMembersCount,
        authoredPullRequestsCount: authoredPullRequests.length,
        reviewedPullRequestsCount: reviewedPullRequestIds.size,
        approvalsCount: relationships.reduce(function(total, relationship) { return total + relationship.approvalsCount; }, 0),
        discussionsStartedCount: relationships.reduce(function(total, relationship) { return total + relationship.discussionsStartedCount; }, 0),
        commentsCount: relationships.reduce(function(total, relationship) { return total + relationship.commentsCount; }, 0),
        sizeTierCounts: sizeTierCounts
      };
    }

    function buildShareData(selectedTeamMembers, relationships, metric) {
      return selectedTeamMembers.map(function(user) {
        return {
          id: user.displayName,
          label: user.displayName,
          value: relationships
            .filter(function(relationship) { return relationship.reviewer.id === user.id; })
            .reduce(function(total, relationship) { return total + relationship[metric]; }, 0),
          userId: user.id
        };
      }).sort(function(left, right) {
        if (right.value !== left.value) return right.value - left.value;
        return left.label.localeCompare(right.label);
      });
    }

    function sortRelationships(left, right) {
      if (right.reviewedPullRequestsCount !== left.reviewedPullRequestsCount) return right.reviewedPullRequestsCount - left.reviewedPullRequestsCount;
      if (right.commentsCount !== left.commentsCount) return right.commentsCount - left.commentsCount;
      return (left.reviewer.displayName + '-' + left.author.displayName).localeCompare(right.reviewer.displayName + '-' + right.author.displayName);
    }

    function getModel() {
      const selected = REPORT_DATA.selectedTeamMembers.filter(function(user) { return state.selectedTeamMemberIds.has(user.id); });
      const pullRequests = REPORT_DATA.pullRequests.filter(function(pr) { return isInDateRange(pr.createdAt, state.from, state.to); });
      return buildTeamReviewModel(pullRequests, selected, state.includeOutside);
    }

    function render() {
      document.getElementById('repoLabel').textContent = REPORT_DATA.owner + '/' + REPORT_DATA.repo;
      document.getElementById('periodLabel').textContent = state.from + ' to ' + state.to;
      document.getElementById('generatedLabel').textContent = 'Generated ' + formatDate(REPORT_DATA.generatedAt);
      document.getElementById('fromDate').value = state.from;
      document.getElementById('toDate').value = state.to;
      document.getElementById('includeOutside').checked = state.includeOutside;
      document.getElementById('metric').value = state.metric;
      renderTeamControls();
      const model = getModel();
      renderInsights(model);
      renderMatrix(model);
      renderRelationshipDetails(model);
      renderSizeSummary(model);
      renderShare('approvalShare', 'Approvals', 'Share of approvals given by selected team members.', model.approvalShare);
      renderShare('discussionShare', 'Discussions started', 'Share of review discussions started by selected team members.', model.discussionShare);
      renderAuthoredPullRequests(model);
      renderTalkingPoints(model);
      attachListeners();
    }

    function renderTeamControls() {
      document.getElementById('teamControls').innerHTML = REPORT_DATA.selectedTeamMembers.map(function(user) {
        return '<label class="team-pill"><input type="checkbox" data-team-user="' + escapeHtml(user.id) + '"' + (state.selectedTeamMemberIds.has(user.id) ? ' checked' : '') + '><img class="avatar small" alt="" src="' + escapeHtml(user.avatarUrl) + '">' + escapeHtml(user.displayName) + '</label>';
      }).join('');
    }

    function renderInsights(model) {
      const items = [
        ['Team members', model.summary.teamMembersCount],
        ['PRs authored', model.summary.authoredPullRequestsCount],
        ['PRs reviewed', model.summary.reviewedPullRequestsCount],
        ['Approvals', model.summary.approvalsCount],
        ['Discussions', model.summary.discussionsStartedCount],
        ['Comments', model.summary.commentsCount]
      ];
      document.getElementById('insights').innerHTML = items.map(function(item) {
        return '<div class="insight"><div class="label">' + escapeHtml(item[0]) + '</div><div class="value">' + escapeHtml(item[1]) + '</div></div>';
      }).join('');
    }

    function renderMatrix(model) {
      if (model.selectedTeamMembers.length === 0) {
        document.getElementById('matrix').innerHTML = '<div class="empty">Select team members above to load reviewer-to-author relationships.</div>';
        return;
      }
      const relationshipsById = new Map(model.relationships.map(function(relationship) { return [relationship.id, relationship]; }));
      const outsideAuthorsById = new Map();
      model.relationships.forEach(function(relationship) {
        if (!relationship.isAuthorSelectedTeamMember) outsideAuthorsById.set(relationship.author.id, relationship.author);
      });
      const columns = model.selectedTeamMembers.map(function(user) { return { user: user, isSelectedTeamMember: true }; }).concat(
        Array.from(outsideAuthorsById.values()).sort(function(left, right) { return left.displayName.localeCompare(right.displayName); }).map(function(user) {
          return { user: user, isSelectedTeamMember: false };
        })
      );
      let maxMetricValue = 0;
      model.selectedTeamMembers.forEach(function(reviewer) {
        columns.forEach(function(column) {
          const relationship = relationshipsById.get(getRelationshipId(reviewer.id, column.user.id));
          if (relationship) maxMetricValue = Math.max(maxMetricValue, relationship[state.metric]);
        });
      });
      const header = '<tr><th style="min-width:220px">Reviewer / author</th>' + columns.map(function(column) {
        return '<th><div class="column-person"><img class="avatar" alt="" src="' + escapeHtml(column.user.avatarUrl) + '"><div class="person-name">' + escapeHtml(column.user.displayName) + '</div>' + (!column.isSelectedTeamMember ? '<span class="outside">Outside</span>' : '') + '</div></th>';
      }).join('') + '</tr>';
      const rows = model.selectedTeamMembers.map(function(reviewer) {
        const cells = columns.map(function(column) {
          if (reviewer.id === column.user.id) return '<td class="self-cell">Self</td>';
          const relationship = relationshipsById.get(getRelationshipId(reviewer.id, column.user.id));
          if (!relationship) return '<td class="empty-cell">-</td>';
          const value = relationship[state.metric];
          const intensity = maxMetricValue > 0 && value > 0 ? value / maxMetricValue : 0;
          const alpha = intensity <= 0 ? 0 : 0.12 + intensity * 0.62;
          const color = intensity > 0.58 ? '#fff' : '#121828';
          return '<td><button class="cell-button' + (state.selectedRelationshipId === relationship.id ? ' selected' : '') + '" data-relationship="' + escapeHtml(relationship.id) + '" style="background: rgba(80,72,229,' + alpha.toFixed(2) + '); color: ' + color + '">' + escapeHtml(value) + '</button></td>';
        }).join('');
        return '<tr><td><div class="person"><img class="avatar" alt="" src="' + escapeHtml(reviewer.avatarUrl) + '"><div><div class="person-name">' + escapeHtml(reviewer.displayName) + '</div><div class="person-sub">' + escapeHtml(reviewer.userName) + '</div></div></div></td>' + cells + '</tr>';
      }).join('');
      document.getElementById('matrix').innerHTML = '<div class="matrix-wrap"><table><thead>' + header + '</thead><tbody>' + rows + '</tbody></table></div>';
    }

    function renderRelationshipDetails(model) {
      const relationship = model.relationships.find(function(item) { return item.id === state.selectedRelationshipId; });
      if (!relationship) {
        document.getElementById('relationshipDetails').innerHTML = '<h2>Relationship details</h2><div class="empty">Select a relationship cell to inspect the relationship.</div>';
        return;
      }
      const pullRequests = relationship.pullRequests.map(function(pr) {
        return '<li class="pr-item"><img class="avatar" alt="" src="' + escapeHtml(pr.author.avatarUrl) + '"><div><a href="' + escapeHtml(pr.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(pr.title) + '</a><div class="person-sub">' + escapeHtml(pr.repositoryName) + ' · ' + escapeHtml(formatDate(pr.createdAt)) + '</div></div><span class="tag">' + escapeHtml(pr.status) + '</span></li>';
      }).join('');
      document.getElementById('relationshipDetails').innerHTML =
        '<h2>Relationship details</h2>' +
        '<div class="person"><img class="avatar large" alt="" src="' + escapeHtml(relationship.reviewer.avatarUrl) + '"><div><div class="person-name">' + escapeHtml(relationship.reviewer.displayName) + '</div><div class="person-sub">Reviewer</div></div></div>' +
        '<p class="muted">reviewed</p>' +
        '<div class="person"><img class="avatar large" alt="" src="' + escapeHtml(relationship.author.avatarUrl) + '"><div><div class="person-name">' + escapeHtml(relationship.author.displayName) + '</div><div class="person-sub">' + (relationship.isAuthorSelectedTeamMember ? 'Team author' : 'Outside author') + '</div></div></div>' +
        '<hr>' +
        metricRow('Reviewed PRs', relationship.reviewedPullRequestsCount) +
        metricRow('Approvals', relationship.approvalsCount) +
        metricRow('Discussions started', relationship.discussionsStartedCount) +
        metricRow('Comments left', relationship.commentsCount) +
        '<h3 style="margin-top:18px">Pull requests</h3><ul class="pr-list">' + pullRequests + '</ul>';
    }

    function renderSizeSummary(model) {
      document.getElementById('sizeSummary').innerHTML = '<h2>PR sizes</h2>' + SIZE_TIERS.map(function(tier) {
        return metricRow(SIZE_TIER_LABELS[tier] + '<div class="person-sub">' + SIZE_TIER_RANGES[tier] + '</div>', model.summary.sizeTierCounts[tier]);
      }).join('');
    }

    function renderShare(elementId, title, description, data) {
      const max = Math.max.apply(null, data.map(function(item) { return item.value; }).concat([0]));
      const rows = data.filter(function(item) { return item.value > 0; }).map(function(item) {
        const width = max > 0 ? Math.max(4, Math.round((item.value / max) * 100)) : 0;
        return '<div class="bar-row"><div class="person-name">' + escapeHtml(item.label) + '</div><div class="bar-track"><div class="bar" style="width:' + width + '%"></div></div><strong>' + escapeHtml(item.value) + '</strong></div>';
      }).join('');
      document.getElementById(elementId).innerHTML = '<h2>' + escapeHtml(title) + '</h2><p class="subtitle">' + escapeHtml(description) + '</p>' + (rows || '<div class="empty">No captured activity for this metric.</div>');
    }

    function renderAuthoredPullRequests(model) {
      const rows = model.authoredPullRequests.map(function(pr) {
        return '<li class="pr-item"><img class="avatar" alt="" src="' + escapeHtml(pr.author.avatarUrl) + '"><div><a href="' + escapeHtml(pr.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(pr.title) + '</a><div class="person-sub">' + escapeHtml(pr.repositoryName) + ' · ' + escapeHtml(formatDate(pr.createdAt)) + ' · +' + escapeHtml(pr.linesAdded) + ' / -' + escapeHtml(pr.linesRemoved) + '</div></div><span class="tag">' + escapeHtml(SIZE_TIER_LABELS[getPullRequestSizeTier(pr)]) + '</span></li>';
      }).join('');
      document.getElementById('authoredPullRequests').innerHTML = '<h2>Pull requests</h2><p class="subtitle">Authored pull requests created by selected team members in the selected period.</p>' + (rows ? '<ul class="pr-list">' + rows + '</ul>' : '<div class="empty">Selected team members did not create pull requests in this period.</div>');
    }

    function renderTalkingPoints(model) {
      const points = buildTalkingPoints(model);
      document.getElementById('talkingPoints').innerHTML = '<h2>Review talking points</h2><ol class="talking-points">' + points.map(function(point) { return '<li>' + escapeHtml(point) + '</li>'; }).join('') + '</ol>';
    }

    function buildTalkingPoints(model) {
      const points = [];
      if (model.summary.authoredPullRequestsCount === 0) points.push('No authored pull requests were captured for the selected team in this period.');
      if (model.relationships.length === 0) points.push('No captured reviewer-to-author relationships were found for the current filters.');
      const outsideRelationships = model.relationships.filter(function(item) { return !item.isAuthorSelectedTeamMember; });
      if (outsideRelationships.length > 0) points.push(outsideRelationships.length + ' relationship(s) show selected team review effort going to authors outside the selected team.');
      const topReviewer = model.approvalShare.concat(model.discussionShare).sort(function(left, right) { return right.value - left.value; })[0];
      if (topReviewer && topReviewer.value > 0) points.push(topReviewer.label + ' has the highest captured review activity in the selected metric mix.');
      const largeCount = model.summary.sizeTierCounts.large + model.summary.sizeTierCounts.veryLarge;
      if (largeCount > 0) points.push(largeCount + ' authored PR(s) were large or very large and may deserve review process attention.');
      if (points.length === 0) points.push('Review activity looks balanced for the selected team and period.');
      return points.slice(0, 5);
    }

    function metricRow(label, value) {
      return '<div class="metric-row"><div class="muted">' + label + '</div><strong>' + escapeHtml(value) + '</strong></div>';
    }

    function attachListeners() {
      document.getElementById('fromDate').onchange = function(event) { state.from = event.target.value; state.selectedRelationshipId = null; render(); };
      document.getElementById('toDate').onchange = function(event) { state.to = event.target.value; state.selectedRelationshipId = null; render(); };
      document.getElementById('includeOutside').onchange = function(event) { state.includeOutside = event.target.checked; state.selectedRelationshipId = null; render(); };
      document.getElementById('metric').onchange = function(event) { state.metric = event.target.value; render(); };
      document.querySelectorAll('[data-team-user]').forEach(function(input) {
        input.onchange = function(event) {
          if (event.target.checked) state.selectedTeamMemberIds.add(event.target.dataset.teamUser);
          else state.selectedTeamMemberIds.delete(event.target.dataset.teamUser);
          state.selectedRelationshipId = null;
          render();
        };
      });
      document.querySelectorAll('[data-relationship]').forEach(function(button) {
        button.onclick = function(event) {
          state.selectedRelationshipId = event.currentTarget.dataset.relationship;
          render();
        };
      });
    }

    render();
  </script>
</body>
</html>`;
}

function metricSummary(model) {
  return {
    teamMembers: model.summary.teamMembersCount,
    authoredPullRequests: model.summary.authoredPullRequestsCount,
    relationships: model.relationships.length,
  };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toPublicUser(user) {
  return {
    id: user.id,
    login: user.userName,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    profileUrl: user.webUrl,
  };
}

function toPublicDatasetUser(user) {
  return {
    id: user.id,
    login: user.login,
    displayName: user.displayName,
    profileUrl: user.profileUrl,
  };
}

function resolveDatasetTeamUsers(values, users) {
  if (values.length === 0) {
    return [];
  }

  const usersByToken = new Map();
  users.forEach((user) => {
    usersByToken.set(normalizeForMatch(user.id), user);
    usersByToken.set(normalizeForMatch(user.login), user);
    usersByToken.set(normalizeForMatch(user.displayName), user);
    usersByToken.set(normalizeForMatch(user.fullName), user);
  });

  return values.map((value) => {
    const user = usersByToken.get(normalizeForMatch(value));

    if (!user) {
      throw new Error(`Unable to find team user in dataset: ${value}`);
    }

    return user;
  });
}

function filterDatasetPullRequests(dataset, { from = dataset.source.from, to = dataset.source.to, teamUsers = [] } = {}) {
  const selectedIds = new Set(resolveDatasetTeamUsers(teamUsers, dataset.users).map((user) => user.id));
  return dataset.pullRequests.filter((pullRequest) => {
    const inRange = isInDateRange(pullRequest.createdAt, from, to);
    const inTeam = selectedIds.size === 0 || selectedIds.has(pullRequest.authorId) || hasReviewActivityFromUsers(pullRequest, selectedIds);
    return inRange && inTeam;
  });
}

function hasReviewActivityFromUsers(pullRequest, userIds) {
  return (
    pullRequest.reviews.some((review) => userIds.has(review.userId)) ||
    pullRequest.reviewComments.some((comment) => userIds.has(comment.userId))
  );
}

function summarizeCanonicalPullRequests(pullRequests, selectedUserIds = new Set()) {
  const authored = selectedUserIds.size === 0 ? pullRequests : pullRequests.filter((pullRequest) => selectedUserIds.has(pullRequest.authorId));
  const reviewedIds = new Set();
  pullRequests.forEach((pullRequest) => {
    if (
      selectedUserIds.size === 0 ||
      pullRequest.reviews.some((review) => selectedUserIds.has(review.userId)) ||
      pullRequest.reviewComments.some((comment) => selectedUserIds.has(comment.userId))
    ) {
      reviewedIds.add(pullRequest.id);
    }
  });

  return {
    pullRequests: pullRequests.length,
    authoredPullRequests: authored.length,
    reviewedPullRequests: reviewedIds.size,
    approvals: pullRequests.reduce(
      (total, pullRequest) =>
        total + pullRequest.reviews.filter((review) => review.state === 'APPROVED' && (selectedUserIds.size === 0 || selectedUserIds.has(review.userId))).length,
      0
    ),
    reviewComments: pullRequests.reduce(
      (total, pullRequest) =>
        total + pullRequest.reviewComments.filter((comment) => selectedUserIds.size === 0 || selectedUserIds.has(comment.userId)).length,
      0
    ),
    linesAdded: authored.reduce((total, pullRequest) => total + pullRequest.linesAdded, 0),
    linesRemoved: authored.reduce((total, pullRequest) => total + pullRequest.linesRemoved, 0),
  };
}

function toExtractPullRequest(pullRequest) {
  return {
    id: pullRequest.id,
    number: pullRequest.number,
    title: pullRequest.title,
    url: pullRequest.url,
    status: pullRequest.status,
    authorId: pullRequest.authorId,
    createdAt: pullRequest.createdAt,
    mergedAt: pullRequest.mergedAt,
    linesAdded: pullRequest.linesAdded,
    linesRemoved: pullRequest.linesRemoved,
    changedFilesCount: pullRequest.changedFilesCount,
    reviewCount: pullRequest.reviews.length,
    reviewCommentCount: pullRequest.reviewComments.length,
    changedFilePaths: pullRequest.changedFiles.map((file) => file.path),
  };
}

function getDatasetDateRange(dataset) {
  const timestamps = dataset.pullRequests.map((pullRequest) => new Date(pullRequest.createdAt).getTime()).filter(Number.isFinite);

  if (timestamps.length === 0) {
    return null;
  }

  return {
    from: new Date(Math.min(...timestamps)).toISOString(),
    to: new Date(Math.max(...timestamps)).toISOString(),
  };
}

function analyzeSprintTrends(dataset, { sprints, sprintDays, selectedUserIds }) {
  const sourceEnd = new Date(`${dataset.source.to}T23:59:59.999Z`);
  const sprintMs = sprintDays * 24 * 60 * 60 * 1000;
  const result = [];

  for (let index = sprints - 1; index >= 0; index--) {
    const sprintEnd = new Date(sourceEnd.getTime() - index * sprintMs);
    const sprintStart = new Date(sprintEnd.getTime() - sprintMs + 1);
    const pullRequests = dataset.pullRequests.filter((pullRequest) => {
      const created = new Date(pullRequest.createdAt).getTime();
      return created >= sprintStart.getTime() && created <= sprintEnd.getTime();
    });
    result.push({
      from: sprintStart.toISOString().slice(0, 10),
      to: sprintEnd.toISOString().slice(0, 10),
      ...summarizeCanonicalPullRequests(pullRequests, selectedUserIds),
    });
  }

  return result;
}

function analyzeUnitTests(dataset, { selectedUserIds }) {
  const pullRequests = selectedUserIds.size === 0
    ? dataset.pullRequests
    : dataset.pullRequests.filter((pullRequest) => selectedUserIds.has(pullRequest.authorId));
  const withUnitTests = pullRequests.filter(hasUnitTestChanges);
  const withoutUnitTests = pullRequests.filter((pullRequest) => !hasUnitTestChanges(pullRequest));

  return {
    pullRequests: pullRequests.length,
    withUnitTests: withUnitTests.length,
    withoutUnitTests: withoutUnitTests.length,
    ratio: pullRequests.length === 0 ? 0 : Math.round((withUnitTests.length / pullRequests.length) * 1000) / 1000,
    examplesWithoutUnitTests: withoutUnitTests.slice(0, 20).map((pullRequest) => ({
      id: pullRequest.id,
      number: pullRequest.number,
      title: pullRequest.title,
      url: pullRequest.url,
      authorId: pullRequest.authorId,
      changedFilePaths: pullRequest.changedFiles.map((file) => file.path).slice(0, 20),
    })),
  };
}

function hasUnitTestChanges(pullRequest) {
  return pullRequest.changedFiles.some((file) => isUnitTestPath(file.path));
}

function isUnitTestPath(filePath) {
  return /(^|\/)(__tests__|tests?|specs?)\//i.test(filePath) || /\.(test|spec)\.[cm]?[jt]sx?$/i.test(filePath);
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function runSelfTests() {
  testPeriodValidation();
  testTeamMatching();
  testConversionAndModel();
  testAvatarFallback();
  testHtmlOfflineShape();
  console.log('All self-tests passed.');
}

function testPeriodValidation() {
  assert.equal(requireDateOnly('2026-04-30', '--from'), '2026-04-30');
  assert.throws(() => requireDateOnly('04/30/2026', '--from'), /YYYY-MM-DD/);
  assert.throws(() => requireString('', '--host'), /required/);
  assert.throws(() => requireToken({}), /GITEA_TOKEN/);
  assert.equal(requireToken({ GITEA_TOKEN: 'token' }), 'token');
}

function testTeamMatching() {
  const users = [
    { id: 1, login: 'alice', full_name: 'Alice Doe', avatar_url: 'https://example.test/alice.png', active: true },
    { id: 2, login: 'bob', full_name: 'Bob Smith', avatar_url: 'https://example.test/bob.png', active: true },
    { id: 3, login: 'bobby', full_name: 'Robert Smith', avatar_url: 'https://example.test/bobby.png', active: true },
  ];
  const exact = resolveTeamMembers('backend team: alice, Bob Smith', users, 'https://gitea.test');
  assert.deepEqual(exact.selectedUsers.map((user) => user.login), ['alice', 'bob']);
  assert.equal(exact.hasAmbiguity, false);

  const partial = resolveTeamMembers('team: Smith', users, 'https://gitea.test');
  assert.equal(partial.candidates[0].status, 'ambiguous');

  const unmatched = resolveTeamMembers('team: Carol', users, 'https://gitea.test');
  assert.equal(unmatched.candidates[0].status, 'unmatched');

  const excluded = resolveTeamMembers('team: alice, bob except alice', users, 'https://gitea.test');
  assert.deepEqual(excluded.selectedUsers.map((user) => user.login), ['bob']);
}

function testConversionAndModel() {
  const raw = createRawFixture();
  const host = 'https://gitea.test';
  const pullRequest = convertToPullRequest(host, raw);
  assert.equal(pullRequest.author.userName, 'alice');
  assert.equal(pullRequest.approvedByUser[0].user.userName, 'bob');
  assert.equal(pullRequest.discussions.length, 1);
  assert.equal(getPullRequestSizeTier(pullRequest), 'compact');

  const users = [raw.pullRequest.user, raw.reviews[0].user].map((user) => convertToUser(host, user));
  const model = buildTeamReviewModel([pullRequest], [users[0], users[1]], { includeOutsideTeamMembers: true });
  assert.deepEqual(metricSummary(model), { teamMembers: 2, authoredPullRequests: 1, relationships: 1 });
  assert.equal(model.summary.approvalsCount, 1);
  assert.equal(model.summary.discussionsStartedCount, 1);
  assert.equal(model.summary.commentsCount, 2);
}

function testAvatarFallback() {
  const uri = fallbackAvatarDataUri('Alice Doe');
  assert.ok(uri.startsWith('data:image/svg+xml;base64,'));
}

function testHtmlOfflineShape() {
  const raw = createRawFixture();
  const host = 'https://gitea.test';
  const users = [raw.pullRequest.user, raw.reviews[0].user].map((user) => ({
    ...convertToUser(host, user),
    avatarUrl: fallbackAvatarDataUri(user.login),
  }));
  const pullRequest = convertToPullRequest(host, raw);
  pullRequest.author.avatarUrl = users[0].avatarUrl;
  pullRequest.reviewedByUser[0].user.avatarUrl = users[1].avatarUrl;
  pullRequest.approvedByUser[0].user.avatarUrl = users[1].avatarUrl;
  pullRequest.comments.forEach((comment) => {
    comment.prAuthorAvatarUrl = users[0].avatarUrl;
    comment.reviewerAvatarUrl = users[1].avatarUrl;
  });
  pullRequest.discussions.forEach((discussion) => {
    discussion.reviewerAvatarUrl = users[1].avatarUrl;
    discussion.comments.forEach((comment) => {
      comment.prAuthorAvatarUrl = users[0].avatarUrl;
      comment.reviewerAvatarUrl = users[1].avatarUrl;
    });
  });
  const html = generateHtml({
    host,
    owner: 'org',
    repo: 'repo',
    from: '2026-04-01',
    to: '2026-04-30',
    includeOutside: true,
    selectedTeamMembers: users,
    users,
    pullRequests: [pullRequest],
    generatedAt: '2026-05-14T00:00:00.000Z',
  });
  assert.ok(html.includes('const REPORT_DATA = '));
  assert.ok(!html.includes('<script src='));
  assert.ok(!html.includes('<link rel="stylesheet"'));
  assert.ok(html.includes('data:image/svg+xml;base64,'));
}

function createRawFixture() {
  return {
    projectName: 'repo',
    pullRequest: {
      id: 101,
      number: 7,
      title: 'Improve report',
      html_url: 'https://gitea.test/org/repo/pulls/7',
      url: 'https://gitea.test/api/v1/repos/org/repo/pulls/7',
      state: 'closed',
      merged: true,
      created_at: '2026-04-10T10:00:00Z',
      updated_at: '2026-04-11T10:00:00Z',
      merged_at: '2026-04-11T10:00:00Z',
      user: { id: 1, login: 'alice', full_name: 'Alice Doe', avatar_url: 'https://example.test/alice.png', active: true },
      base: { label: 'main' },
      head: { label: 'feature' },
      requested_reviewers: [],
    },
    reviews: [
      {
        id: 201,
        state: 'APPROVED',
        body: 'Looks good',
        submitted_at: '2026-04-10T12:00:00Z',
        html_url: 'https://gitea.test/org/repo/pulls/7#review-201',
        comments_count: 1,
        user: { id: 2, login: 'bob', full_name: 'Bob Smith', avatar_url: 'https://example.test/bob.png', active: true },
      },
    ],
    comments: [
      {
        id: 301,
        pull_request_review_id: 201,
        path: 'src/report.js',
        position: 5,
        body: 'Consider extracting this',
        created_at: '2026-04-10T11:00:00Z',
        html_url: 'https://gitea.test/org/repo/pulls/7#comment-301',
        user: { id: 2, login: 'bob', full_name: 'Bob Smith', avatar_url: 'https://example.test/bob.png', active: true },
      },
    ],
    timeline: [],
    files: [{ filename: 'src/report.js', additions: 80, deletions: 10 }],
  };
}

main();
