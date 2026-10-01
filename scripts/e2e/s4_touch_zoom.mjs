import { newPlayer } from './helpers.mjs';

export async function runS4(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const { context, page } = await newPlayer(browser, { width: 375, height: 667 });
  const results = [];

  try {
    await page.goto(`${cleanBase}/?mock=1&players=4&hand=8`, { waitUntil: 'networkidle', timeout: 15000 });
    const cdp = await context.newCDPSession(page);

    // Hàm giả lập CDP Touch nhấn giữ 600ms
    const cdpTouchHold = async (selector) => {
      const el = page.locator(selector).first();
      await el.waitFor({ state: 'visible', timeout: 5000 });
      const box = await el.boundingBox();
      if (!box) throw new Error(`Không lấy được bounding box cho ${selector}`);

      const x = Math.round(box.x + Math.min(15, box.width * 0.3));
      const y = Math.round(box.y + box.height * 0.4);

      // 1. Touch Start
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y, id: 0 }],
      });

      // 2. Giữ 650ms
      await page.waitForTimeout(650);

      // 3. Touch End
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });

      // Chờ phản ứng
      await page.waitForTimeout(400);
    };

    // Test 1: Nhấn giữ lá bài tay ở mép trái (Lá đầu tiên)
    await cdpTouchHold('[data-testid^="hand-card-"]');
    const zoomLeftOpen = await page.locator('[data-testid="card-zoom"]').isVisible();
    results.push({
      name: 'CDP Touch 650ms lá mép trái: phóng to vẫn mở sau khi thả tay',
      passed: zoomLeftOpen,
      detail: `zoomOpened=${zoomLeftOpen}`,
    });

    // Đóng zoom
    if (zoomLeftOpen) {
      await page.locator('[data-testid="card-zoom-backdrop"]').click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);
    }

    // Test 2: Nhấn giữ lá bài tay ở mép phải (Lá cuối cùng)
    const handCards = await page.locator('[data-testid^="hand-card-"]').all();
    if (handCards.length > 0) {
      const lastIndex = handCards.length - 1;
      const lastSelector = `[data-card-index="${lastIndex}"]`;
      await cdpTouchHold(lastSelector);
      const zoomRightOpen = await page.locator('[data-testid="card-zoom"]').isVisible();
      results.push({
        name: 'CDP Touch 650ms lá mép phải: phóng to vẫn mở sau khi thả tay',
        passed: zoomRightOpen,
        detail: `zoomOpened=${zoomRightOpen}`,
      });

      // Đóng zoom
      if (zoomRightOpen) {
        await page.locator('[data-testid="card-zoom-backdrop"]').click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);
      }
    }

    // Test 3: Nhấn giữ lá Bệnh Lý trong Thể Trạng
    await cdpTouchHold('[data-testid^="psyche-slot-"]');
    const zoomPsycheOpen = await page.locator('[data-testid="card-zoom"]').isVisible();
    results.push({
      name: 'CDP Touch 650ms Thể Trạng: mở phóng to và vẫn mở sau khi thả tay',
      passed: zoomPsycheOpen,
      detail: `zoomOpened=${zoomPsycheOpen}`,
    });

    if (zoomPsycheOpen) {
      await page.locator('[data-testid="card-zoom-backdrop"]').click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);
    }
  } catch (err) {
    results.push({ name: 'Lỗi thực thi CDP touch zoom S4', passed: false, detail: err.message });
  } finally {
    await context.close();
  }

  const allPassed = results.every((r) => r.passed);
  return { id: 'S4', name: 'Kiểm tra nhấn giữ cảm ứng thật (CDP Touch)', passed: allPassed, items: results };
}
