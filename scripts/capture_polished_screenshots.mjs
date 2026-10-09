import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { getChromeExecutable } from './e2e/helpers.mjs';

const BASE_URL = process.env.URL || 'http://localhost:3000';
const OUTPUT_DIR = path.resolve('gameplay_screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  const executablePath = getChromeExecutable();
  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  console.log('Capturing polished screenshots...');

  // 1. polished_homepage_375x667.png
  {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const p = path.join(OUTPUT_DIR, 'polished_homepage_375x667.png');
    await page.screenshot({ path: p });
    console.log(`[Screenshot] polished_homepage_375x667.png`);
    await ctx.close();
  }

  // 2. polished_lobby_375x667.png
  {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const nameInput = page.locator('input[placeholder*="tên" i], input[type="text"]').first();
    await nameInput.fill('VIP Host');
    await page.locator('button:has-text("Tạo phòng mới")').click();
    await page.waitForSelector('[data-testid="invite-url-input"]', { timeout: 8000 });
    const addBotBtn = page.locator('[data-testid="add-bot-button"]');
    if (await addBotBtn.isVisible()) {
      await addBotBtn.click();
      await page.waitForTimeout(300);
      await addBotBtn.click();
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(400);
    const p = path.join(OUTPUT_DIR, 'polished_lobby_375x667.png');
    await page.screenshot({ path: p });
    console.log(`[Screenshot] polished_lobby_375x667.png`);
    await ctx.close();
  }

  // 3. polished_gameboard_375x667.png
  {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/?mock=1&players=4&hand=8&turn=me`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const card = page.locator('[data-testid^="hand-card-"]').first();
    if (await card.isVisible()) {
      await card.click({ position: { x: 14, y: 30 } });
      await page.waitForTimeout(300);
    }
    const p = path.join(OUTPUT_DIR, 'polished_gameboard_375x667.png');
    await page.screenshot({ path: p });
    console.log(`[Screenshot] polished_gameboard_375x667.png`);
    await ctx.close();
  }

  // 4. polished_gameboard_667x375.png
  {
    const ctx = await browser.newContext({
      viewport: { width: 667, height: 375 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/?mock=1&players=4&hand=8&turn=me`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const card = page.locator('[data-testid^="hand-card-"]').first();
    if (await card.isVisible()) {
      await card.click({ position: { x: 14, y: 30 } });
      await page.waitForTimeout(300);
    }
    const p = path.join(OUTPUT_DIR, 'polished_gameboard_667x375.png');
    await page.screenshot({ path: p });
    console.log(`[Screenshot] polished_gameboard_667x375.png`);
    await ctx.close();
  }

  // 5. polished_gameboard_1280x800.png
  {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
      isMobile: false,
      hasTouch: false,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/?mock=1&players=4&hand=8&turn=me`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const card = page.locator('[data-testid^="hand-card-"]').first();
    if (await card.isVisible()) {
      await card.click({ position: { x: 14, y: 30 } });
      await page.waitForTimeout(300);
    }
    const p = path.join(OUTPUT_DIR, 'polished_gameboard_1280x800.png');
    await page.screenshot({ path: p });
    console.log(`[Screenshot] polished_gameboard_1280x800.png`);
    await ctx.close();
  }

  await browser.close();
  console.log('All 5 polished screenshots captured successfully!');
}

main().catch(console.error);
