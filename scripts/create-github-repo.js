import { chromium } from '@playwright/test';

const GITHUB_USERNAME = 'syed4abdurrehman';
const GITHUB_PASSWORD = process.env.GITHUB_PASSWORD;
const REPO_NAME       = 'cineweb';
const REPO_DESC       = 'A full-stack streaming site built with React, Vite, Node.js and Express.';

if (!GITHUB_PASSWORD) {
  console.error('❌  Set the GITHUB_PASSWORD environment variable first.');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const page    = await browser.newPage();

  /* ── 1. Log in ────────────────────────────────────────────────── */
  console.log('🌐  Navigating to GitHub login…');
  await page.goto('https://github.com/login', { waitUntil: 'networkidle' });

  await page.fill('#login_field', GITHUB_USERNAME);
  await page.fill('#password',    GITHUB_PASSWORD);
  await page.click('[name="commit"]');           // "Sign in" button
  await page.waitForURL('https://github.com/', { timeout: 15_000 });
  console.log('✅  Logged in as', GITHUB_USERNAME);

  /* ── 2. Open "New repository" page ───────────────────────────── */
  console.log('📁  Opening new-repository form…');
  await page.goto('https://github.com/new', { waitUntil: 'networkidle' });

  /* ── 3. Fill in repo details ──────────────────────────────────── */
  // Repository name
  await page.fill('#repository_name', REPO_NAME);
  // Wait for the name-availability check
  await page.waitForTimeout(1200);

  // Description
  await page.fill('#repository_description', REPO_DESC);

  // Set to Private
  await page.check('#repository_visibility_private');   // radio: private

  // Leave "Initialize this repository" unchecked (we'll push the existing code)

  /* ── 4. Submit ────────────────────────────────────────────────── */
  console.log('🚀  Creating private repository…');
  await page.click('[data-disable-with="Creating repository…"]');
  await page.waitForURL(`https://github.com/${GITHUB_USERNAME}/${REPO_NAME}`, { timeout: 15_000 });

  console.log(`✅  Private repo created: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}`);

  await browser.close();
})();
