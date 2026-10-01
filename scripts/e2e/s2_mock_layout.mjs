import { newPlayer, measureLayout } from './helpers.mjs';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

export async function runS2(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const screenshotDir = path.join(os.tmpdir(), 'side-effects-mock-screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  // 5 màn hình đo theo Phần 2 mục H1 & Bảng mục E
  const viewports = [
    {
      name: '375×667',
      width: 375,
      height: 667,
      minHand: 76,
      minPsyche: 72,
      minOpp: 34,
      allowOppText: true,
    },
    {
      name: '390×844',
      width: 390,
      height: 844,
      minHand: 96,
      minPsyche: 84,
      minOpp: 44,
      allowOppText: false,
    },
    {
      name: '667×375',
      width: 667,
      height: 375,
      minHand: 64,
      minPsyche: 60,
      minOpp: 34,
      allowOppText: true,
    },
    {
      name: '844×390',
      width: 844,
      height: 390,
      minHand: 70,
      minPsyche: 66,
      minOpp: 36,
      allowOppText: false,
    },
    {
      name: '1280×800',
      width: 1280,
      height: 800,
      minHand: 120,
      minPsyche: 110,
      minOpp: 64,
      allowOppText: false,
    },
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
        const handExposureOk = m.minHandExposure >= 24;

        // Bảng mục E: kiểm tra bề rộng ảnh lá
        const handWidthOk = m.minHandCardWidth >= vp.minHand;
        const psycheWidthOk = m.minPsycheCardWidth >= vp.minPsyche;
        const oppWidthOk =
          (vp.allowOppText && !m.hasOppImages) ||
          (m.hasOppImages && m.minOppCardWidth >= vp.minOpp);

        // Mục H1: Tiêu chí kiểm tra ảnh lá
        const imagesContainOk = m.allImagesContain;
        const imagesRatioOk = m.allImagesRatioOk;
        const imagesNaturalWidthOk = m.allImagesNaturalWidthOk;
        const noOverlayOk = m.allPointsNoOverlay;
        const gapOk = m.maxVerticalGap <= 40;
        const noClippedOk = m.noTextOverflowClipped;
        const noBrokenWordOk = m.noWordBrokenAcrossLines;
        const oppSeatsOk = m.allOpponentSeatsInViewport;
        const endTurnOk = m.endTurnInside;
        const minFontOk = m.minFontSize >= 11;
        const emojiOk = m.emojiCount <= 3;
        const consoleOk = consoleErrors.length === 0;

        const rowPassed =
          noHOverflow &&
          noVOverflow &&
          handOk &&
          handExposureOk &&
          handWidthOk &&
          psycheWidthOk &&
          oppWidthOk &&
          imagesContainOk &&
          imagesRatioOk &&
          imagesNaturalWidthOk &&
          noOverlayOk &&
          gapOk &&
          noClippedOk &&
          noBrokenWordOk &&
          oppSeatsOk &&
          endTurnOk &&
          minFontOk &&
          emojiOk &&
          consoleOk;

        if (!rowPassed) allPassed = false;

        testItems.push({
          name: `${vp.name} | ${cfg.players} người | ${cfg.hand} lá`,
          passed: rowPassed,
          detail: `sw/iw=${m.scrollWidth}/${m.innerWidth}, sh/ih=${m.scrollHeight}/${m.innerHeight}, handCardW=${m.minHandCardWidth}px(>=${vp.minHand}), psycheW=${m.minPsycheCardWidth}px(>=${vp.minPsyche}), oppW=${m.minOppCardWidth}px, minExposure=${m.minHandExposure}px, contain=${imagesContainOk}, ratio=${imagesRatioOk}, noOverlay=${noOverlayOk}, maxGap=${m.maxVerticalGap}px, noBrokenWord=${noBrokenWordOk}, oppInVp=${oppSeatsOk}, fontMin=${m.minFontSize}px, emoji=${m.emojiCount}`,
        });

        tableRows.push({
          viewport: vp.name,
          players: cfg.players,
          hand: cfg.hand,
          scrollW: `${m.scrollWidth}/${m.innerWidth}`,
          scrollH: `${m.scrollHeight}/${m.innerHeight}`,
          handStatus: `${m.handCardsInViewport}/${m.totalHandCards} (w=${m.minHandCardWidth}px, lộ ≥${m.minHandExposure}px)`,
          psycheStatus: `w=${m.minPsycheCardWidth}px (>=${vp.minPsyche}px)`,
          oppStatus: m.hasOppImages ? `w=${m.minOppCardWidth}px` : 'chữ',
          maxGap: `${m.maxVerticalGap}px`,
          noOverlay: noOverlayOk ? '✓' : '✗',
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

  // Đo thêm trên phòng thật: 1 người + 1 máy và 1 người + 3 máy (Phần 2 mục H1)
  for (const botCount of [1, 3]) {
    const { context, page } = await newPlayer(browser, { width: 390, height: 844 });
    try {
      await page.goto(cleanBase, { waitUntil: 'networkidle', timeout: 15000 });
      const nameInput = page.locator('input[placeholder*="tên" i], input[type="text"]').first();
      await nameInput.fill(`Test S2 Bot${botCount}`);
      await page.locator('button:has-text("Tạo phòng mới")').click();
      await page.waitForSelector('[data-testid="invite-url-input"]', { timeout: 8000 });

      // Thêm bot
      for (let b = 0; b < botCount; b++) {
        await page.locator('button:has-text("Thêm máy")').click();
        await page.waitForTimeout(200);
      }

      await page.locator('button:has-text("Bắt đầu")').click();
      await page.waitForSelector('[data-testid="game-board-container"]', { timeout: 10000 });
      await page.waitForTimeout(500);

      const m = await measureLayout(page);
      const realRoomPassed =
        m.noHorizontalOverflow &&
        m.noVerticalOverflow &&
        m.allHandCardsInViewport &&
        m.minHandCardWidth >= 96 &&
        m.allOpponentSeatsInViewport &&
        m.allImagesContain &&
        m.allPointsNoOverlay;

      if (!realRoomPassed) allPassed = false;

      testItems.push({
        name: `Phòng thật: 1 người + ${botCount} máy (390×844)`,
        passed: realRoomPassed,
        detail: `sw/iw=${m.scrollWidth}/${m.innerWidth}, sh/ih=${m.scrollHeight}/${m.innerHeight}, handCardW=${m.minHandCardWidth}px, oppInVp=${m.allOpponentSeatsInViewport}, noOverlay=${m.allPointsNoOverlay}`,
      });
    } catch (err) {
      allPassed = false;
      testItems.push({
        name: `Phòng thật: 1 người + ${botCount} máy`,
        passed: false,
        detail: err.message,
      });
    } finally {
      await context.close();
    }
  }

  // Test tương tác: Nhấn giữ phóng to & chạm thường
  const { context: intContext, page: intPage } = await newPlayer(browser, { width: 375, height: 667 });
  let interactionPassed = true;
  try {
    await intPage.goto(`${cleanBase}/?mock=1&players=4&hand=8`, { waitUntil: 'networkidle' });

    // 1. Chạm thường (100ms): chọn lá bài, không mở zoom (chạm vào phần lộ ra x=12)
    const firstCard = intPage.locator('[data-testid^="hand-card-"]').first();
    await firstCard.click({ position: { x: 12, y: 30 } });
    await intPage.waitForTimeout(200);
    const zoomVisibleAfterClick = await intPage.locator('[data-testid="card-zoom"]').isVisible();
    const clickOk = !zoomVisibleAfterClick;

    // 2. Nhấn chuột phải: mở zoom
    await firstCard.click({ button: 'right', position: { x: 12, y: 30 } });
    await intPage.waitForTimeout(300);
    const zoomVisibleAfterHold = await intPage.locator('[data-testid="card-zoom"]').isVisible();

    // 3. Chạm ra ngoài để đóng zoom (chờ qua 600ms guard time của backdrop)
    if (zoomVisibleAfterHold) {
      await intPage.waitForTimeout(650);
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
    name: 'Bố cục bàn chơi /?mock=1 (5 kích thước × cấu hình & phòng thật)',
    passed: allPassed && interactionPassed,
    items: testItems,
    tableRows,
  };
}
