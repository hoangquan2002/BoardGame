import { launchBrowser } from './e2e/helpers.mjs';

async function main() {
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:3000/?mock=1&players=4&hand=8');
  await page.waitForSelector('[data-testid="game-board-container"]');

  const sectionSelectors = [
    'header',
    '[data-testid="portrait-top-section"]',
    'aside',
    '[data-testid="center-table-bar"]',
    '[data-testid="self-psyche-section"]',
    '[data-testid="action-info-bar"]',
    '[data-testid="self-hand-section"]',
  ];

  const sections = await page.evaluate((selectors) => {
    return selectors
      .map(sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { sel, top: r.top, bottom: r.bottom, height: r.height };
      })
      .filter(Boolean)
      .sort((a, b) => a.top - b.top);
  }, sectionSelectors);

  console.log('Sections sorted by top:', sections);
  for (let i = 0; i < sections.length - 1; i++) {
    const gap = sections[i + 1].top - sections[i].bottom;
    console.log(`Gap between ${sections[i].sel} and ${sections[i + 1].sel}:`, gap);
  }
  await browser.close();
}

main().catch(console.error);
