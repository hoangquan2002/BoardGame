import { newPlayer } from './helpers.mjs';

export async function runS13(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const { context, page } = await newPlayer(browser, { width: 375, height: 667 });
  const results = [];

  try {
    await page.goto(cleanBase, { waitUntil: 'networkidle', timeout: 15000 });

    // 1. Tạo phòng
    const nameInput = page.locator('input[placeholder*="tên" i], input[type="text"]').first();
    await nameInput.fill('Người chơi S13');
    const createBtn = page.locator('button:has-text("Tạo phòng mới")');
    await createBtn.click();
    await page.waitForSelector('[data-testid="invite-url-input"]', { timeout: 8000 });

    const inviteUrl = await page.evaluate(() => {
      const input = document.querySelector('[data-testid="invite-url-input"]') || document.querySelector('input[readonly]');
      return input ? input.value : '';
    });
    const codeMatch = inviteUrl.match(/room=([A-Z0-9]+)/i);
    const roomCode = codeMatch ? codeMatch[1] : '';

    results.push({
      name: 'Khởi tạo phòng cho kiểm thử socket',
      passed: Boolean(roomCode),
      detail: `roomCode="${roomCode}"`,
    });

    // 2. Tải lại trang (F5 / Reload) khi đang ở trong phòng: khôi phục phiên
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Kiểm tra xem phòng chờ vẫn được khôi phục hoặc hiện hộp thoại khôi phục
    const stillInLobby = await page.locator('[data-testid="invite-url-input"]').isVisible();
    const resumeDialog = await page.locator('text=Tìm thấy phiên chơi trước đó').isVisible();
    const restoreOk = stillInLobby || resumeDialog;

    results.push({
      name: 'Tải lại trang (F5): tự động kết nối lại hoặc khôi phục phiên',
      passed: restoreOk,
      detail: `stillInLobby=${stillInLobby}, resumeDialog=${resumeDialog}`,
    });
  } catch (err) {
    results.push({ name: 'Lỗi kiểm thử socket chịu lỗi S13', passed: false, detail: err.message });
  } finally {
    await context.close();
  }

  const allPassed = results.every((r) => r.passed);
  return { id: 'S13', name: 'Kiểm tra socket chịu lỗi & khôi phục phiên', passed: allPassed, items: results };
}
