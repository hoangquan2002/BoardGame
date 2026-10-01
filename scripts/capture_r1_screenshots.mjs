import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { getChromeExecutable } from './e2e/helpers.mjs';

const BASE_URL = process.env.URL || 'http://localhost:3000';
const OUTPUT_DIR = path.resolve('gameplay_screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureMock(browser, name, width, height, query) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: width < 1024,
    hasTouch: width < 1024,
  });
  const page = await context.newPage();
  const url = `${BASE_URL}/?mock=1&${query}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Chọn lá bài đầu tiên nếu turn=me để làm nổi bật mục tiêu
  if (query.includes('turn=me')) {
    const card = page.locator('[data-testid^="hand-card-"]').first();
    if (await card.isVisible()) {
      await card.click({ position: { x: 12, y: 30 } });
      await page.waitForTimeout(300);
    }
  }

  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath });
  console.log(`[Screenshot] ${name}.png (${width}x${height})`);
  await context.close();
}

async function captureZoom(browser, name, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: width < 1024,
    hasTouch: width < 1024,
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/?mock=1&players=4&hand=8&turn=me`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const card = page.locator('[data-testid^="hand-card-"]').first();
  await card.click({ button: 'right', position: { x: 12, y: 30 } });
  await page.waitForTimeout(400);

  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath });
  console.log(`[Screenshot Zoom] ${name}.png`);
  await context.close();
}

async function main() {
  const executablePath = getChromeExecutable();
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('Capturing R1 screenshots to:', OUTPUT_DIR);

  // 1. 5 màn hình turn=me, đang chọn lá Thuốc, có mục tiêu sáng
  await captureMock(browser, 'r1_375x667_p4_h8', 375, 667, 'players=4&hand=8&turn=me');
  await captureMock(browser, 'r1_390x844_p4_h8', 390, 844, 'players=4&hand=8&turn=me');
  await captureMock(browser, 'r1_667x375_p4_h8', 667, 375, 'players=4&hand=8&turn=me');
  await captureMock(browser, 'r1_844x390_p4_h8', 844, 390, 'players=4&hand=8&turn=me');
  await captureMock(browser, 'r1_1280x800_p4_h8', 1280, 800, 'players=4&hand=8&turn=me');

  // 2. Các cấu hình đặc biệt
  await captureMock(browser, 'r1_375x667_p4_h12', 375, 667, 'players=4&hand=12&turn=me');
  await captureMock(browser, 'r1_390x844_p2_h4', 390, 844, 'players=2&hand=4&turn=me');

  // 3. Phóng to
  await captureZoom(browser, 'r1_zoom_390x844', 390, 844);
  await captureZoom(browser, 'r1_zoom_844x390', 844, 390);

  await browser.close();
  console.log('All R1 screenshots captured successfully!');
}

main().catch(console.error);
