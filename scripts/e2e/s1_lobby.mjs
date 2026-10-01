import { newPlayer } from './helpers.mjs';

export async function runS1(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const viewports = [
    { name: '320×568', width: 320, height: 568 },
    { name: '375×667', width: 375, height: 667 },
    { name: '667×375', width: 667, height: 375 },
  ];

  const results = [];

  for (const vp of viewports) {
    const { context, page, consoleErrors: _consoleErrors } = await newPlayer(browser, vp);
    try {
      await page.goto(cleanBase, { waitUntil: 'networkidle', timeout: 15000 });

      // 1. Kiểm tra tràn ngang trang chủ
      const homeOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      results.push({
        name: `Trang chủ không tràn ngang (${vp.name})`,
        passed: homeOverflow,
        detail: `scrollWidth <= innerWidth`,
      });

      // 2. Tạo phòng trên 375x667
      if (vp.name === '375×667') {
        const nameInput = page.locator('input[placeholder*="tên" i], input[type="text"]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('An');
        }

        const createBtn = page.locator('button:has-text("Tạo phòng mới")');
        if (await createBtn.isVisible()) {
          await createBtn.click();
          await page.waitForSelector('[data-testid="invite-url-input"]', { timeout: 8000 });

          // Kiểm tra phòng chờ
          const lobbyOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth <= window.innerWidth;
          });
          results.push({
            name: `Phòng chờ không tràn ngang (${vp.name})`,
            passed: lobbyOverflow,
            detail: `scrollWidth <= innerWidth`,
          });

          // Kiểm tra link mời chứa đúng domain
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

          // Thêm máy đến 4/4
          const addBotBtn = page.locator('[data-testid="add-bot-button"]');
          if (await addBotBtn.isVisible()) {
            await addBotBtn.click();
            await page.waitForTimeout(500);
            await addBotBtn.click();
            await page.waitForTimeout(500);
            await addBotBtn.click();
            await page.waitForTimeout(500);

            // Kiểm tra nút thêm máy bị disabled khi đủ 4
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

  const allPassed = results.every((r) => r.passed);
  return { id: 'S1', name: 'Kiểm tra trang chủ và phòng chờ', passed: allPassed, items: results };
}
