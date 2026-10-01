import { newPlayer, rotate, measureLayout } from './helpers.mjs';

export async function runS8(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const { context, page } = await newPlayer(browser, { width: 375, height: 667 });
  const results = [];

  try {
    await page.goto(`${cleanBase}/?mock=1&players=4&hand=8`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(400);

    // 1. Chọn lá bài đầu tiên
    const firstCard = page.locator('[data-testid^="hand-card-"]').first();
    await firstCard.click({ position: { x: 14, y: 30 } });
    await page.waitForTimeout(300);

    const isSelectedBefore = (await firstCard.getAttribute('data-selected')) === 'true';
    results.push({
      name: 'Chọn lá bài trên tay ở màn hình dọc',
      passed: isSelectedBefore,
      detail: `isSelected=${isSelectedBefore}`,
    });

    // 2. Xoay ngang màn hình (667×375)
    await rotate(page);
    await page.waitForTimeout(400);

    // Kiểm tra lá bài vẫn được chọn
    const isSelectedAfterRotate = (await firstCard.getAttribute('data-selected')) === 'true';
    results.push({
      name: 'Lá bài vẫn được chọn sau khi xoay ngang',
      passed: isSelectedAfterRotate,
      detail: `isSelected=${isSelectedAfterRotate}`,
    });

    // Kiểm tra không hiện thông báo "mất kết nối"
    const _disconnectedBanner = await page.locator('text=Mất kết nối').first().isVisible().catch(() => false);
    // Lưu ý: "Mất kết nối" trên ghế đối thủ mất kết nối mẫu là đúng, nhưng banner toàn bàn mất kết nối thì không có
    const globalDisconnectAlert = await page.locator('text=Bạn đã mất kết nối').isVisible().catch(() => false);
    results.push({
      name: 'Không báo mất kết nối khi xoay màn hình',
      passed: !globalDisconnectAlert,
      detail: 'Kết nối ổn định',
    });

    // 3. Đo lại bố cục ở màn hình ngang
    const mLandscape = await measureLayout(page);
    const layoutOk = mLandscape.noHorizontalOverflow && mLandscape.noVerticalOverflow && mLandscape.allHandCardsInViewport;
    results.push({
      name: 'Bố cục xoay ngang vẫn đạt chuẩn không cuộn trang',
      passed: layoutOk,
      detail: `sw/iw=${mLandscape.scrollWidth}/${mLandscape.innerWidth}, sh/ih=${mLandscape.scrollHeight}/${mLandscape.innerHeight}`,
    });

    // 4. Xoay dọc lại (375×667)
    await rotate(page);
    await page.waitForTimeout(400);
    const isSelectedAfterRestore = (await firstCard.getAttribute('data-selected')) === 'true';
    results.push({
      name: 'Lá bài vẫn được chọn khi xoay dọc trở lại',
      passed: isSelectedAfterRestore,
      detail: `isSelected=${isSelectedAfterRestore}`,
    });
  } catch (err) {
    results.push({ name: 'Lỗi kiểm thử xoay màn hình S8', passed: false, detail: err.message });
  } finally {
    await context.close();
  }

  const allPassed = results.every((r) => r.passed);
  return { id: 'S8', name: 'Kiểm tra xoay ngang/dọc giữa ván chơi', passed: allPassed, items: results };
}
