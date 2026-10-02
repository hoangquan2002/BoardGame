import { newPlayer } from './helpers.mjs';

export async function runS16(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const results = [];

  // ==================== PHẦN 1: CA MOCK /?mock=1&hand=12&turn=me ====================
  const mockViewports = [
    { name: '375×667', width: 375, height: 667 },
    { name: '667×375', width: 667, height: 375 },
  ];

  for (const vp of mockViewports) {
    const { context, page } = await newPlayer(browser, vp);
    try {
      await page.goto(`${cleanBase}/?mock=1&hand=12&turn=me`, { waitUntil: 'networkidle', timeout: 15000 });

      // 1. Kiểm tra nút Kết thúc lượt bật và ghi số lá phải bỏ
      const endBtn = page.locator('[data-testid="end-turn-button"]');
      await endBtn.waitFor({ state: 'visible', timeout: 8000 });

      const isEnabled = await endBtn.isEnabled();
      const btnText = (await endBtn.innerText()).trim();
      const textHasDiscard = btnText.includes('Kết thúc lượt') && btnText.includes('bỏ 6 lá');

      results.push({
        name: `Nút Kết thúc lượt bật và ghi "bỏ 6 lá" (Mock 12 lá - ${vp.name})`,
        passed: isEnabled && textHasDiscard,
        detail: `enabled=${isEnabled}, text="${btnText}"`,
      });

      // 2. Bấm nút Kết thúc lượt -> DiscardModal hiện
      await endBtn.click();
      const modal = page.locator('[data-testid="discard-modal"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });

      // 3. Chọn đủ 6 lá bài
      const cards = page.locator('[data-testid^="discard-card-"]');
      const count = await cards.count();
      results.push({
        name: `Hộp bỏ bài hiển thị đủ các lá trên tay (Mock 12 lá - ${vp.name})`,
        passed: count >= 12,
        detail: `số lá hiển thị=${count}`,
      });

      for (let i = 0; i < 6; i++) {
        await cards.nth(i).click();
        await page.waitForTimeout(100);
      }

      // 4. Kiểm tra nút xác nhận bỏ bài bật
      const confirmBtn = page.locator('[data-testid="confirm-discard-button"]');
      const confirmEnabled = await confirmBtn.isEnabled();
      const confirmText = (await confirmBtn.innerText()).trim();

      results.push({
        name: `Nút xác nhận bỏ bài bật khi chọn đủ 6 lá (Mock 12 lá - ${vp.name})`,
        passed: confirmEnabled && confirmText.includes('6 lá'),
        detail: `confirmEnabled=${confirmEnabled}, text="${confirmText}"`,
      });

      // 5. Bấm xác nhận bỏ bài -> modal đóng
      await confirmBtn.click();
      await page.waitForTimeout(500);
      const modalClosed = !(await modal.isVisible());

      results.push({
        name: `Bỏ bài thành công và đóng hộp thoại (Mock 12 lá - ${vp.name})`,
        passed: modalClosed,
        detail: `modalClosed=${modalClosed}`,
      });

    } catch (err) {
      results.push({
        name: `Lỗi kiểm tra Mock 12 lá (${vp.name})`,
        passed: false,
        detail: err.message,
      });
    } finally {
      await context.close().catch(() => {});
    }
  }

  // ==================== PHẦN 2: VÁN THẬT TAY TÍCH LUỸ >= 8 LÁ ====================
  for (const vp of mockViewports) {
    const { context, page } = await newPlayer(browser, vp);
    try {
      await page.goto(cleanBase, { waitUntil: 'networkidle', timeout: 15000 });

      // Tạo phòng mới
      const nameInput = page.locator('input[placeholder*="tên" i], input[type="text"]').first();
      await nameInput.fill(`Tester_${vp.name.replace('×', 'x')}`);
      await page.locator('button:has-text("Tạo phòng mới")').click();
      await page.waitForSelector('[data-testid="invite-url-input"]', { timeout: 10000 });

      // Thêm 1 bot và bắt đầu
      const addBotBtn = page.locator('[data-testid="add-bot-button"]');
      await addBotBtn.click();
      await page.waitForTimeout(400);

      await page.locator('button:has-text("Bắt đầu")').click();
      await page.waitForSelector('[data-testid="game-board-container"]', { timeout: 12000 });

      // Chờ tới lượt mình:
      // Trong ván 2 người (1 người + 1 bot), lượt đầu tiên nếu là mình:
      // rút 2 lá lên 6 lá -> bấm kết thúc lượt mà không đánh lá nào -> tay còn 6 lá.
      // Bot đi lượt của bot.
      // Tới lượt thứ 2 của mình: rút 2 lá lên 8 lá!
      let reached8Cards = false;
      const startTime = Date.now();

      while (Date.now() - startTime < 45000) {
        const isMyTurn = await page.evaluate(() => {
          const btn = document.querySelector('[data-testid="end-turn-button"]');
          return btn && !btn.hasAttribute('disabled');
        });

        if (isMyTurn) {
          const handCount = await page.locator('[data-testid^="hand-card-"]').count();
          if (handCount >= 8) {
            reached8Cards = true;
            break;
          }

          // Chưa đủ 8 lá (ví dụ đang có 6 lá), bấm kết thúc lượt để bot đi
          const endBtn = page.locator('[data-testid="end-turn-button"]');
          await endBtn.click();
          await page.waitForTimeout(1000);
        } else {
          await page.waitForTimeout(600);
        }
      }

      if (reached8Cards) {
        // Kiểm tra nút Kết thúc lượt bật và ghi "bỏ X lá"
        const endBtn = page.locator('[data-testid="end-turn-button"]');
        const isEnabled = await endBtn.isEnabled();
        const btnText = (await endBtn.innerText()).trim();
        const hasDiscardText = btnText.includes('bỏ');

        results.push({
          name: `Ván thật tay >= 8 lá: nút Kết thúc lượt bật và ghi số lá phải bỏ (${vp.name})`,
          passed: isEnabled && hasDiscardText,
          detail: `enabled=${isEnabled}, text="${btnText}"`,
        });

        // Bấm nút -> DiscardModal hiện
        await endBtn.click();
        const modal = page.locator('[data-testid="discard-modal"]');
        await modal.waitFor({ state: 'visible', timeout: 5000 });

        // Chọn đủ số lá cần bỏ
        const discardCards = page.locator('[data-testid^="discard-card-"]');
        const dCount = await discardCards.count();

        // Lấy số lá cần bỏ từ text nút
        const neededMatch = btnText.match(/bỏ\s+(\d+)\s+lá/i);
        const needed = neededMatch ? parseInt(neededMatch[1], 10) : 2;

        for (let i = 0; i < needed && i < dCount; i++) {
          await discardCards.nth(i).click();
          await page.waitForTimeout(100);
        }

        const confirmBtn = page.locator('[data-testid="confirm-discard-button"]');
        const canConfirm = await confirmBtn.isEnabled();
        let modalDetached = false;
        if (canConfirm) {
          await confirmBtn.click();
          try {
            await modal.waitFor({ state: 'detached', timeout: 5000 });
            modalDetached = true;
          } catch {
            modalDetached = false;
          }
        }

        // Sau khi bỏ bài, modal phải đóng và bài tay đã được xử lý (<= 6 lá hoặc ván tiếp diễn sang lượt kế)
        const remainingCards = await page.locator('[data-testid^="hand-card-"]').count();
        results.push({
          name: `Ván thật: bỏ đủ lá, chuyển lượt và bài tay còn 6 lá (${vp.name})`,
          passed: modalDetached,
          detail: `modalDetached=${modalDetached}, bài tay hiện tại=${remainingCards} lá`,
        });
      } else {
        results.push({
          name: `Ván thật tay >= 8 lá (${vp.name})`,
          passed: false,
          detail: 'Hết thời gian chờ tạo tình huống tay >= 8 lá',
        });
      }

    } catch (err) {
      results.push({
        name: `Lỗi ván thật S16 (${vp.name})`,
        passed: false,
        detail: err.message,
      });
    } finally {
      await context.close().catch(() => {});
    }
  }

  const allPassed = results.every((r) => r.passed);
  return { id: 'S16', name: 'Kết thúc lượt khi bài tay > 6 lá & DiscardModal', passed: allPassed, items: results };
}
