import path from 'node:path';
import { readFileSync } from 'node:fs';
import { expect, Locator, Page, test } from '@playwright/test';

const fixturePath = path.join(__dirname, 'fixtures', 'review-data.json');
const baseFixture = JSON.parse(readFileSync(fixturePath, 'utf8'));

function captureBrowserErrors(page: Page) {
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    const text = message.text();
    const isLegacyNivoPropTypeWarning = text.startsWith('Warning: Failed %s type:');
    const isLegacyBrowserCryptoFallback = text.startsWith('Module "crypto" has been externalized for browser compatibility.');

    if (
      (message.type() === 'error' || message.type() === 'warning') &&
      !isLegacyNivoPropTypeWarning &&
      !isLegacyBrowserCryptoFallback
    ) {
      errors.push(`console: ${text}`);
    }
  });

  return () => expect(errors, 'browser console and page errors').toEqual([]);
}

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

async function expectFilterLayout(page: Page, headingName: string) {
  const filter = page.getByTestId('analysis-filter-panel');
  const heading = page.getByRole('heading', { name: headingName, exact: true });
  const [filterBox, headingBox] = await Promise.all([filter.boundingBox(), heading.boundingBox()]);

  expect(filterBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(filterBox!.y + filterBox!.height).toBeLessThanOrEqual(headingBox!.y + 1);

  const clippedControls = await filter
    .locator('button, input:not([type="checkbox"]), [role="combobox"]')
    .evaluateAll((elements) =>
      elements
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            label: element.getAttribute('aria-label') ?? element.textContent ?? element.tagName,
            left: rect.left,
            right: rect.right,
            width: rect.width,
          };
        })
        .filter(({ width, left, right }) => width > 2 && (left < -1 || right > window.innerWidth + 1))
    );

  expect(clippedControls, 'filter controls clipped by the viewport').toEqual([]);
}

async function expectChartCardsDoNotOverlap(page: Page) {
  const overlaps = await page.locator('section[aria-label$=" chart"]').evaluateAll((sections) => {
    const boxes = sections.map((section) => ({
      label: section.getAttribute('aria-label'),
      rect: section.getBoundingClientRect(),
    }));
    const collisions: string[] = [];

    for (let leftIndex = 0; leftIndex < boxes.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < boxes.length; rightIndex += 1) {
        const left = boxes[leftIndex];
        const right = boxes[rightIndex];
        const overlapX = Math.min(left.rect.right, right.rect.right) - Math.max(left.rect.left, right.rect.left);
        const overlapY = Math.min(left.rect.bottom, right.rect.bottom) - Math.max(left.rect.top, right.rect.top);

        if (overlapX > 1 && overlapY > 1) collisions.push(`${left.label} overlaps ${right.label}`);
      }
    }

    return collisions;
  });

  expect(overlaps, 'chart cards overlap').toEqual([]);
}

async function openGuestPage(page: Page, route: 'charts' | 'one-on-one' | 'team-review') {
  await page.addInitScript(() => {
    localStorage.setItem('credentials', JSON.stringify({ access: 'guest' }));
    localStorage.setItem('color-mode-preference', 'light');
  });
  await page.goto(`./${route}`);
  await expect(page.getByRole('button', { name: 'Import as JSON' })).toBeVisible();
  await expectNoPageOverflow(page);
  await page
    .locator('input[type="file"]')
    .setInputFiles(
      route === 'charts' || route === 'team-review'
        ? { name: 'dense-review-data.json', mimeType: 'application/json', buffer: createDenseFixture() }
        : fixturePath
    );
}

function createDenseFixture() {
  const fixture = structuredClone(baseFixture);
  const additionalNames = [
    'Dana Designer',
    'Evan Engineer',
    'Fatima Frontend',
    'George Gateway',
    'Hana Helper',
    'Ivan Integrator',
    'Jo Reviewer',
    'Kai Maintainer',
    'Lina Lead',
  ];

  additionalNames.forEach((fullName, index) => {
    const id = index + 4;
    const login = fullName.toLowerCase().replace(/\s+/g, '.');
    const user = { id, login, full_name: fullName, avatar_url: '', active: true };
    const previousUser = id === 4 ? fixture.data.users[1] : fixture.data.users.at(-1);
    const month = String(index + 1).padStart(2, '0');
    const reviewDate = `2026-${month}-12T12:00:00.000Z`;
    const pullRequest = structuredClone(fixture.data.pullRequests[0]);

    fixture.data.users.push(user);
    pullRequest.pullRequest = {
      ...pullRequest.pullRequest,
      id: 200 + id,
      title: `${fullName} dashboard improvement`,
      created_at: `2026-${month}-08T09:00:00.000Z`,
      updated_at: reviewDate,
      merged_at: reviewDate,
      user,
      requested_reviewers: [fixture.data.users[0], previousUser],
    };
    pullRequest.reviews = [
      {
        ...pullRequest.reviews[0],
        id: 3000 + id * 10,
        submitted_at: reviewDate,
        user: fixture.data.users[0],
      },
      {
        ...pullRequest.reviews[0],
        id: 3001 + id * 10,
        submitted_at: reviewDate,
        user: previousUser,
      },
    ];
    pullRequest.comments = [
      {
        ...pullRequest.comments[0],
        id: 4000 + id * 10,
        created_at: reviewDate,
        pull_request_review_id: 3000 + id * 10,
        user: fixture.data.users[0],
      },
      {
        ...pullRequest.comments[0],
        id: 4001 + id * 10,
        created_at: reviewDate,
        pull_request_review_id: 3001 + id * 10,
        user: previousUser,
      },
    ];
    fixture.data.pullRequests.push(pullRequest);
  });

  return Buffer.from(JSON.stringify(fixture));
}

test('login page keeps its controls usable and aligned', async ({ page }) => {
  const expectNoBrowserErrors = captureBrowserErrors(page);

  await page.addInitScript(() => localStorage.setItem('color-mode-preference', 'light'));
  await page.goto('./login');
  await expect(page.getByRole('heading', { name: 'Code Review Analyzer' })).toBeVisible();
  const hostType = page.getByRole('combobox').first();
  await expect(hostType).toContainText('Gitlab');
  await hostType.click();
  await expect(page.getByRole('option', { name: 'Gitlab' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('textbox', { name: 'Host' })).toBeVisible();
  await expect(page.getByLabel('Token')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login As Guest' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
  await expectNoPageOverflow(page);
  await expect(page).toHaveScreenshot('login.png');

  expectNoBrowserErrors();
});

test('login page supports dark mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('color-mode-preference', 'light'));
  await page.goto('./login');
  await expect(page.getByRole('heading', { name: 'Code Review Analyzer' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  await page.getByRole('heading', { name: 'Code Review Analyzer' }).click();
  await expect(page).toHaveScreenshot('login-dark.png');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('color-mode-preference'))).toBe('dark');
});

test('charts page imports data and keeps MUI controls interactive', async ({ page }) => {
  const expectNoBrowserErrors = captureBrowserErrors(page);

  await openGuestPage(page, 'charts');
  await expect(page.getByRole('heading', { name: 'Highlights' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Discussions', exact: true })).toBeVisible();

  await page
    .getByRole('button', { name: /Choose date, selected date is/ })
    .first()
    .click();
  await expect(page.getByRole('grid')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');

  await expectFilterLayout(page, 'Highlights');
  await expectNoPageOverflow(page);
  await expectChartCardsDoNotOverlap(page);
  await expect(page).toHaveScreenshot('charts.png');

  const trendChart = page.getByRole('region', { name: 'Discussions started by person per month chart' });
  await trendChart.scrollIntoViewIfNeeded();
  await page.mouse.move(1, 1);
  await expect(page).toHaveScreenshot('charts-section.png');

  await page.getByRole('button', { name: 'Close Analysis' }).click();
  await expect(page.getByRole('dialog', { name: 'Close Analysis?' })).toBeVisible();
  await page.getByRole('button', { name: 'Go Back' }).click();

  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('menuitem', { name: 'Logout' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  await page.getByRole('heading', { name: 'Highlights' }).click();
  await expect(page).toHaveScreenshot('charts-dark.png');

  const ratioTile = page.getByText('Review ratio', { exact: true }).locator('..').locator('..');
  await ratioTile.getByLabel('More information').hover();
  const helpTooltip = page.getByRole('tooltip', { name: /Represents the probability/ });
  const helpTooltipSurface = helpTooltip.locator('.MuiTooltip-tooltip');
  await expect(helpTooltip).toBeVisible();
  await expect(helpTooltipSurface).toHaveCSS('background-color', 'rgb(21, 26, 36)');
  await expect(helpTooltipSurface).toHaveCSS('color', 'rgb(243, 245, 250)');
  await page.mouse.move(1, 1);
  await expect(helpTooltip).toHaveCount(0);

  await trendChart.scrollIntoViewIfNeeded();
  await page.mouse.move(1, 1);
  await expect(page).toHaveScreenshot('charts-section-dark.png');
  await trendChart.locator('svg rect[data-ref^="slice:"]').first().hover();
  const chartTooltip = page.getByTestId('line-chart-tooltip');
  await expect(chartTooltip).toBeVisible();
  await expect(chartTooltip).toHaveCSS('background-color', 'rgb(21, 26, 36)');
  await expect(chartTooltip).toHaveCSS('color', 'rgb(243, 245, 250)');
  await expect(page).toHaveScreenshot('chart-tooltip-dark.png');

  await trendChart.getByRole('button', { name: 'View full screen' }).click();
  const expandedChart = page.getByRole('dialog', { name: 'Discussions started by person per month chart' });
  await expect(expandedChart).toBeVisible();
  const [expandedZIndex, filterZIndex] = await Promise.all([
    expandedChart.evaluate((element) => Number(getComputedStyle(element).zIndex)),
    page.getByTestId('analysis-filter-panel').evaluate((element) => Number(getComputedStyle(element).zIndex)),
  ]);
  expect(expandedZIndex).toBeGreaterThan(filterZIndex);
  await page.keyboard.press('Escape');
  await expect(expandedChart).toHaveCount(0);

  const chartGrid = page.getByRole('region', { name: 'Top 10 Longest Discussions chart' });
  await chartGrid.scrollIntoViewIfNeeded();
  await page.mouse.move(1, 1);
  await expect(page).toHaveScreenshot('chart-grid-dark.png');

  expectNoBrowserErrors();
});

test('one-on-one page renders imported collaboration data', async ({ page }) => {
  const expectNoBrowserErrors = captureBrowserErrors(page);

  await openGuestPage(page, 'one-on-one');
  await expect(page.getByRole('heading', { name: '1:1 Review' })).toBeVisible();

  await page.getByRole('combobox', { name: 'Team member' }).click();
  await page.getByRole('option', { name: /Alice Reviewer/ }).click();
  await expect(page.getByRole('heading', { name: 'Insights' })).toBeVisible();
  await expect(page.getByText('PRs authored')).toBeVisible();
  await page.mouse.move(1, 1);
  await expect(page.getByRole('tooltip')).toHaveCount(0);

  await expectFilterLayout(page, '1:1 Review');
  await expectNoPageOverflow(page);
  await expect(page).toHaveScreenshot('one-on-one.png');

  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  await page.getByRole('heading', { name: '1:1 Review', exact: true }).click();
  await expect(page).toHaveScreenshot('one-on-one-dark.png');
  expectNoBrowserErrors();
});

test('team review page renders matrix and responsive filters', async ({ page }) => {
  const expectNoBrowserErrors = captureBrowserErrors(page);

  await openGuestPage(page, 'team-review');
  await expect(page.getByRole('heading', { name: 'Team Review' })).toBeVisible();

  const teamMembers = page.getByRole('combobox', { name: 'Team members' });
  await teamMembers.click();
  await page.getByRole('option', { name: /Alice Reviewer/ }).click();
  await page.getByRole('option', { name: /Bob Builder/ }).click();
  await page.keyboard.press('Escape');

  await expect(page.getByRole('heading', { name: 'Review relationships' })).toBeVisible();
  await expect(page.getByLabel('Show outside team')).toBeChecked();
  await page.getByLabel('Show outside team').click();
  await expect(page.getByLabel('Show outside team')).not.toBeChecked();
  await page.getByLabel('Show outside team').click();
  await expect(page.getByLabel('Show outside team')).toBeChecked();
  await page.mouse.move(1, 1);
  await expect(page.getByRole('tooltip')).toHaveCount(0);

  await expectFilterLayout(page, 'Team Review');
  await expectNoPageOverflow(page);
  await expect(page).toHaveScreenshot('team-review.png');

  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.getByRole('heading', { name: 'Team Review', exact: true }).click();
  const selfCell = page.getByTestId('relationship-matrix-cell-1-1');
  await selfCell.scrollIntoViewIfNeeded();
  await expect(selfCell).not.toHaveCSS('background-color', 'rgb(248, 250, 252)');
  await expect(selfCell).not.toHaveCSS('background-color', 'rgb(255, 255, 255)');
  expect(await getContrastRatio(page.getByTestId('relationship-matrix-button-1->2'))).toBeGreaterThanOrEqual(4.5);
  await expect(page).toHaveScreenshot('team-review-dark.png');
  expectNoBrowserErrors();
});

async function getContrastRatio(locator: Locator) {
  return locator.evaluate((element) => {
    const parseRgb = (value: string) =>
      value
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number);
    const luminance = (value: string) => {
      const channels = parseRgb(value).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const styles = getComputedStyle(element);
    const foreground = luminance(styles.color);
    const background = luminance(styles.backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
}
