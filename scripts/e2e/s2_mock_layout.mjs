import { newPlayer, measureLayout } from './helpers.mjs';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

export async function runS2(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const screenshotDir = path.join(os.tmpdir(), 'side-effects-mock-screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const viewports = [
    { name: '375×667 (dọc)', width: 375, height: 667 },
    { name: '667×375 (ngang)', width: 667, height: 375 },
    { name: '390×844 (dọc)', width: 390, height: 844 },
    { name: '844×390 (ngang)', width: 844, height: 390 },
  ];

  const configurations = [
    { players: 2, hand: 4 },
    { players: 3, hand: 8 },
    { players: 4, hand: 8 },
    { players: 4, hand: 12 },
  ];

  const tableRows = [];
  const testItems = [];
  let allPassed = true;

  for (const vp of viewports) {
    for (const cfg of configurations) {
      const { context, page, consoleErrors } = await newPlayer(browser, { width: vp.width, height: vp.height });
      try {
        const url = `${cleanBase}/?mock=1&players=${cfg.players}&hand=${cfg.hand}&turn=other`;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(400);

        const m = await measureLayout(page);

        // Chụp ảnh lưu tạm
        const ssPath = path.join(screenshotDir, `mock_${vp.name.replace(/\s+/g, '_')}_p${cfg.players}_h${cfg.hand}.png`);
        await page.screenshot({ path: ssPath });

        const noHOverflow = m.noHorizontalOverflow;
        const noVOverflow = m.noVerticalOverflow;
        const handOk = m.allHandCardsInViewport;
        const endTurnOk = m.endTurnInside;
        const minFontOk = m.minFontSize >= 11;
        const consoleOk = consoleErrors.length === 0;

        const rowPassed = noHOverflow && noVOverflow && handOk && endTurnOk && minFontOk && consoleOk;
        if (!rowPassed) allPassed = false;

        testItems.push({
          name: `${vp.name} | ${cfg.players} người | ${cfg.hand} lá`,
          passed: rowPassed,
          detail: `sw/iw=${m.scrollWidth}/${m.innerWidth}, sh/ih=${m.scrollHeight}/${m.innerHeight}, hand=${m.handCardsInViewport}/${m.totalHandCards}, endTurnBottom=${m.endTurnBottom}, fontMin=${m.minFontSize}px, errors=${consoleErrors.length}`,
        });

        tableRows.push({
          viewport: vp.name,
          players: cfg.players,
          hand: cfg.hand,
          scrollW: `${m.scrollWidth}/${m.innerWidth}`,
          scrollH: `${m.scrollHeight}/${m.innerHeight}`,
          handStatus: `${m.handCardsInViewport}/${m.totalHandCards}`,
          endTurnBottom: `${m.endTurnBottom}px`,
          minFont: `${m.minFontSize}px`,
          passed: rowPassed ? 'ĐẠT' : 'KHÔNG ĐẠT',
        });
      } catch (err) {
        allPassed = false;
        testItems.push({
          name: `${vp.name} | ${cfg.players} người | ${cfg.hand} lá`,
          passed: false,
          detail: err.message,
        });
      } finally {
        await context.close();
      }
    }
  }

  // Test tương tác: Nhấn giữ phóng to & chạm thường
  const { context: intContext, page: intPage } = await newPlayer(browser, { width: 375, height: 667 });
  let interactionPassed = true;
  try {
    await intPage.goto(`${cleanBase}/?mock=1&players=4&hand=8`, { waitUntil: 'networkidle' });

    // 1. Chạm thường (100ms): chọn lá bài, không mở zoom
    const firstCard = intPage.locator('[data-testid="hand-card-0"]');
    await firstCard.click();
    await intPage.waitForTimeout(200);
    const zoomVisibleAfterClick = await intPage.locator('[data-testid="card-zoom"]').isVisible();
    const clickOk = !zoomVisibleAfterClick;

    // 2. Nhấn chuột phải hoặc chuột giữ 600ms: mở zoom
    await firstCard.dispatchEvent('contextmenu');
    await intPage.waitForTimeout(300);
    const zoomVisibleAfterHold = await intPage.locator('[data-testid="card-zoom"]').isVisible();

    // 3. Chạm ra ngoài để đóng zoom
    if (zoomVisibleAfterHold) {
      await intPage.locator('[data-testid="card-zoom-backdrop"]').click({ position: { x: 10, y: 10 } });
      await intPage.waitForTimeout(300);
    }
    const zoomClosed = !(await intPage.locator('[data-testid="card-zoom"]').isVisible());

    interactionPassed = clickOk && zoomVisibleAfterHold && zoomClosed;
    testItems.push({
      name: 'Thao tác: Chạm thường (chọn lá) & Nhấn giữ/Chuột phải (phóng to card-zoom)',
      passed: interactionPassed,
      detail: `clickKhôngMởZoom=${clickOk}, holdMởZoom=${zoomVisibleAfterHold}, đóngZoom=${zoomClosed}`,
    });
  } catch (err) {
    interactionPassed = false;
    testItems.push({ name: 'Thao tác phóng to', passed: false, detail: err.message });
  } finally {
    await intContext.close();
  }

  return {
    id: 'S2',
    name: 'Bố cục bản phác /?mock=1 (4 kích thước × cấu hình)',
    passed: allPassed && interactionPassed,
    items: testItems,
    tableRows,
  };
}
