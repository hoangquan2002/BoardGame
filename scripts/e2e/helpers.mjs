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

    // Hand cards & min exposure
    const handCardEls = Array.from(document.querySelectorAll('[data-testid^="hand-card-"]'));
    let handCardsInViewport = 0;
    let minHandExposure = 999;

    const sortedHandEls = handCardEls
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return { el, rect };
      })
      .sort((a, b) => a.rect.left - b.rect.left);

    for (let i = 0; i < sortedHandEls.length; i++) {
      const { rect } = sortedHandEls[i];
      if (rect.bottom <= innerHeight + 1 && rect.right <= innerWidth + 1 && rect.top >= 0 && rect.left >= 0) {
        handCardsInViewport++;
      }
      if (i < sortedHandEls.length - 1) {
        const exposure = sortedHandEls[i + 1].rect.left - rect.left;
        if (exposure > 0 && exposure < minHandExposure) {
          minHandExposure = Math.round(exposure);
        }
      } else {
        // Lá cuối cùng lộ toàn bộ chiều rộng
        const exposure = Math.round(rect.width);
        if (exposure > 0 && exposure < minHandExposure) {
          minHandExposure = exposure;
        }
      }
    }
    if (sortedHandEls.length === 0) minHandExposure = 0;

    // End turn button
    const endTurnEl = document.querySelector('[data-testid="end-turn-button"]');
    const endTurnBottom = endTurnEl ? Math.round(endTurnEl.getBoundingClientRect().bottom) : null;
    const endTurnInside = endTurnEl ? endTurnEl.getBoundingClientRect().bottom <= innerHeight + 1 : false;

    // Opponent seats & disorders
    const opponentSeats = Array.from(document.querySelectorAll('[data-testid^="opponent-seat-"]'));
    const opponentDisorders = Array.from(document.querySelectorAll('[data-testid^="opponent-disorder-"]'));
    let allOpponentDisordersVisible = true;
    for (const d of opponentDisorders) {
      const rect = d.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        allOpponentDisordersVisible = false;
      }
    }

    // Min font size across all text elements (đo cả phần tử có con - Phần 1 mục 5)
    let minFontSize = 999;
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const fsPx = parseFloat(window.getComputedStyle(el).fontSize);
      // Chỉ tính các phần tử có hiển thị text direct hoặc gián tiếp
      if (el.textContent && el.textContent.trim().length > 0) {
        if (!isNaN(fsPx) && fsPx > 0 && fsPx < minFontSize) {
          minFontSize = fsPx;
        }
      }
    }

    // Đếm emoji trên toàn bàn chơi (yêu cầu <= 3)
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
      minHandExposure: minHandExposure === 999 ? 24 : minHandExposure,
      endTurnBottom,
      endTurnInside,
      opponentCount: opponentSeats.length,
      opponentDisorderCount: opponentDisorders.length,
      allOpponentDisordersVisible,
      minFontSize: minFontSize === 999 ? 11 : Math.round(minFontSize),
      emojiCount: emojis.length,
    };
  });
}
