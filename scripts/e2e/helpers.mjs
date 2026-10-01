import { chromium } from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';

export function getChromeExecutable() {
  const envPath = process.env.CHROME_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const standardPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    os.homedir() + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const p of standardPaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

export async function launchBrowser({ headed = false } = {}) {
  const executablePath = getChromeExecutable();
  return await chromium.launch({
    executablePath,
    headless: !headed,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
}

export async function newPlayer(browser, viewport = { width: 375, height: 667 }) {
  const context = await browser.newContext({
    viewport,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  return { context, page, consoleErrors };
}

export async function rotate(page) {
  const vp = page.viewportSize();
  if (!vp) return;
  await page.setViewportSize({ width: vp.height, height: vp.width });
  await page.waitForTimeout(200);
}

export async function measureLayout(page) {
  return await page.evaluate(() => {
    const doc = document.documentElement;
    const scrollWidth = doc.scrollWidth;
    const scrollHeight = doc.scrollHeight;
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;

    // Hand cards
    const handCardEls = Array.from(document.querySelectorAll('[data-testid^="hand-card-"]'));
    let handCardsInViewport = 0;
    for (const el of handCardEls) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom <= innerHeight + 1 && rect.right <= innerWidth + 1 && rect.top >= 0 && rect.left >= 0) {
        handCardsInViewport++;
      }
    }

    // End turn button
    const endTurnEl = document.querySelector('[data-testid="end-turn-button"]');
    const endTurnBottom = endTurnEl ? Math.round(endTurnEl.getBoundingClientRect().bottom) : null;
    const endTurnInside = endTurnEl ? endTurnEl.getBoundingClientRect().bottom <= innerHeight + 1 : false;

    // Opponent seats
    const opponentSeats = Array.from(document.querySelectorAll('[data-testid^="opponent-seat-"]'));

    // Psyche slots
    const psycheSlots = Array.from(document.querySelectorAll('[data-testid^="psyche-slot-"]'));

    // Measure min font size across all text elements in game board
    let minFontSize = 999;
    const allTextNodes = document.querySelectorAll('*');
    for (const node of allTextNodes) {
      const text = node.innerText || node.textContent;
      if (text && text.trim().length > 0 && node.children.length === 0) {
        const fsPx = parseFloat(window.getComputedStyle(node).fontSize);
        if (!isNaN(fsPx) && fsPx > 0 && fsPx < minFontSize) {
          minFontSize = fsPx;
        }
      }
    }

    // Emoji count (detect basic emojis)
    const bodyText = document.body.innerText || '';
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = bodyText.match(emojiRegex) || [];

    return {
      scrollWidth,
      scrollHeight,
      innerWidth,
      innerHeight,
      noHorizontalOverflow: scrollWidth <= innerWidth,
      noVerticalOverflow: scrollHeight <= innerHeight,
      totalHandCards: handCardEls.length,
      handCardsInViewport,
      allHandCardsInViewport: handCardsInViewport === handCardEls.length,
      endTurnBottom,
      endTurnInside,
      opponentCount: opponentSeats.length,
      psycheSlotCount: psycheSlots.length,
      minFontSize: minFontSize === 999 ? 11 : Math.round(minFontSize),
      emojiCount: emojis.length,
    };
  });
}
