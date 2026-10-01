import { newPlayer } from './helpers.mjs';

export async function runS1(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const viewports = [
    { name: '320×568', width: 320, height: 568 },
    { name: '375×667', width: 375, height: 667 },
    { name: '667×375', width: 667, height: 375 },
  ];

  const results = [];
  let createdRoomCode = '';

  // 1. Kiểm tra trang chủ & phòng chờ ở các viewport
  for (const vp of viewports) {
    const { context, page } = await newPlayer(browser, vp);
    try {
      await page.goto(cleanBase, { waitUntil: 'networkidle', timeout: 15000 });

      // Trang chủ không tràn ngang
      const homeOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      results.push({
        name: `Trang chủ không tràn ngang (${vp.name})`,
        passed: homeOverflow,
        detail: `scrollWidth <= innerWidth`,
      });

      // Tạo phòng trên 375x667
      if (vp.name === '375×667') {
        const nameInput = page.locator('input[placeholder*="tên" i], input[type="text"]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Chủ phòng');
        }

        const createBtn = page.locator('button:has-text("Tạo phòng mới")');
        if (await createBtn.isVisible()) {
          await createBtn.click();
          await page.waitForSelector('[data-testid="invite-url-input"]', { timeout: 8000 });

          // Kiểm tra phòng chờ không tràn ngang
          const lobbyOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth <= window.innerWidth;
          });
          results.push({
            name: `Phòng chờ không tràn ngang (${vp.name})`,
            passed: lobbyOverflow,
            detail: `scrollWidth <= innerWidth`,
          });

          // Lấy mã phòng và link mời
          const inviteUrl = await page.evaluate(() => {
            const input = document.querySelector('[data-testid="invite-url-input"]') || document.querySelector('input[readonly]');
            return input ? input.value : '';
          });
          const hasBaseUrl = inviteUrl.includes(cleanBase.split('//')[1] || '');
          results.push({
            name: `Link mời dùng đúng domain (${vp.name})`,
            passed: Boolean(inviteUrl && hasBaseUrl),
            detail: `link="${inviteUrl}"`,
          });

          const codeMatch = inviteUrl.match(/room=([A-Z0-9]+)/i);
          if (codeMatch) {
            createdRoomCode = codeMatch[1];
          }

          // Thêm 3 bot để phòng đủ 4/4
          const addBotBtn = page.locator('[data-testid="add-bot-button"]');
          if (await addBotBtn.isVisible()) {
            await addBotBtn.click();
            await page.waitForTimeout(400);
            await addBotBtn.click();
            await page.waitForTimeout(400);
            await addBotBtn.click();
            await page.waitForTimeout(400);

            const isDisabled = await addBotBtn.isDisabled();
            results.push({
              name: `Khoá thêm máy khi đủ 4 người`,
              passed: isDisabled,
              detail: `addBot disabled=${isDisabled}`,
            });
          }
        }
      }
    } catch (err) {
      results.push({ name: `Lỗi test lobby (${vp.name})`, passed: false, detail: err.message });
    } finally {
      await context.close();
    }
  }

  // 2. Kiểm tra vào phòng bằng link (mã điền sẵn) & người thứ 5 bị từ chối kèm tiếng Việt
  if (createdRoomCode) {
    const { context: joinCtx, page: joinPage } = await newPlayer(browser, { width: 375, height: 667 });
    try {
      await joinPage.goto(`${cleanBase}/?room=${createdRoomCode}`, { waitUntil: 'networkidle' });

      // Mã phòng tự điền sẵn
      const roomInputVal = await joinPage.evaluate(() => {
        const input = document.querySelector('input[placeholder*="ABCDE" i]') || document.querySelectorAll('input[type="text"]')[1];
        return input ? input.value : '';
      });
      const prefillOk = roomInputVal.toUpperCase() === createdRoomCode.toUpperCase();
      results.push({
        name: 'Vào phòng bằng link tự điền sẵn mã phòng',
        passed: prefillOk,
        detail: `code="${roomInputVal}" (kỳ vọng "${createdRoomCode}")`,
      });

      // Người thứ 5 cố vào phòng 4/4
      const nameInput = joinPage.locator('input[placeholder*="tên" i], input[type="text"]').first();
      await nameInput.fill('Khách 5');
      const joinBtn = joinPage.locator('button:has-text("Vào phòng")');
      await joinBtn.click();
      await joinPage.waitForTimeout(1000);

      // Kiểm tra có thông báo lỗi tiếng Việt
      const toastText = await joinPage.evaluate(() => {
        const toast = document.querySelector('[role="alert"]') || document.querySelector('.toast');
        return toast ? toast.innerText : (document.body.innerText || '');
      });
      const hasVietnameseError = toastText.toLowerCase().includes('đầy') || toastText.toLowerCase().includes('đủ') || toastText.toLowerCase().includes('tối đa') || toastText.toLowerCase().includes('lỗi');
      results.push({
        name: 'Người thứ 5 bị từ chối kèm thông báo tiếng Việt',
        passed: hasVietnameseError,
        detail: `thông báo="${toastText.slice(0, 100)}"`,
      });
    } catch (err) {
      results.push({ name: 'Lỗi kiểm tra vào phòng bằng link & người thứ 5', passed: false, detail: err.message });
    } finally {
      await joinCtx.close();
    }
  }

  const allPassed = results.every((r) => r.passed);
  return { id: 'S1', name: 'Kiểm tra trang chủ và phòng chờ', passed: allPassed, items: results };
}
