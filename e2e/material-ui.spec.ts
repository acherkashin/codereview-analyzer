import path from 'node:path';
import { expect, Page, test } from '@playwright/test';

const fixturePath = path.join(__dirname, 'fixtures', 'review-data.json');

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

async function openGuestPage(page: Page, route: 'charts' | 'one-on-one' | 'team-review') {
  await page.addInitScript(() => {
    localStorage.setItem('credentials', JSON.stringify({ access: 'guest' }));
  });
  await page.goto(`./${route}`);
  await expect(page.getByRole('button', { name: 'Import as JSON' })).toBeVisible();
  await expectNoPageOverflow(page);
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
}

test('login page keeps its controls usable and aligned', async ({ page }) => {
  const expectNoBrowserErrors = captureBrowserErrors(page);

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
  await expectNoPageOverflow(page);
  await expect(page).toHaveScreenshot('login.png');

  expectNoBrowserErrors();
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
  await expect(page).toHaveScreenshot('charts.png');

  await page.getByRole('button', { name: 'Close Analysis' }).click();
  await expect(page.getByRole('dialog', { name: 'Close Analysis?' })).toBeVisible();
  await page.getByRole('button', { name: 'Go Back' }).click();

  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('menuitem', { name: 'Logout' })).toBeVisible();
  await page.keyboard.press('Escape');

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
  await page.mouse.move(1, 1);
  await expect(page.getByRole('tooltip')).toHaveCount(0);

  await expectFilterLayout(page, 'Team Review');
  await expectNoPageOverflow(page);
  await expect(page).toHaveScreenshot('team-review.png');
  expectNoBrowserErrors();
});
