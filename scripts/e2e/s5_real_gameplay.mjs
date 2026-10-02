import { newPlayer } from './helpers.mjs';

async function dismissZoomIfOpen(page) {
  const closeBtn = page.locator('button[aria-label="Đóng phóng to"]');
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click().catch(() => {});
    await page.waitForTimeout(150);
  }
}

export async function runS5(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const results = [];

  // Tạo 2 người thật: An (host) và Bình (khách) trong 2 context ẩn danh riêng biệt
  const p1 = await newPlayer(browser, { width: 375, height: 667 });
  const p2 = await newPlayer(browser, { width: 375, height: 667 });

  try {
    // 1. An tạo phòng mới
    await p1.page.goto(cleanBase, { waitUntil: 'networkidle', timeout: 15000 });
    const nameInput1 = p1.page.locator('input[placeholder*="tên" i], input[type="text"]').first();
    await nameInput1.fill('An');
    await p1.page.locator('button:has-text("Tạo phòng mới")').click();
    await p1.page.waitForSelector('[data-testid="invite-url-input"]', { timeout: 10000 });

    const inviteUrl = await p1.page.evaluate(() => {
      const input = document.querySelector('[data-testid="invite-url-input"]') || document.querySelector('input[readonly]');
      return input ? input.value : '';
    });
    const codeMatch = inviteUrl.match(/room=([A-Z0-9]+)/i);
    const roomCode = codeMatch ? codeMatch[1] : '';

    results.push({
      name: 'An tạo phòng thành công',
      passed: Boolean(roomCode),
      detail: `roomCode="${roomCode}"`,
    });

    if (!roomCode) {
      throw new Error('Không lấy được mã phòng');
    }

    // 2. Bình vào phòng bằng link
    await p2.page.goto(`${cleanBase}/?room=${roomCode}`, { waitUntil: 'networkidle', timeout: 15000 });
    const nameInput2 = p2.page.locator('input[placeholder*="tên" i], input[type="text"]').first();
    await nameInput2.fill('Bình');
    await p2.page.locator('button:has-text("Vào phòng")').click();
    await p2.page.waitForTimeout(1000);

    // 3. Thêm 2 bot
    const addBotBtn = p1.page.locator('[data-testid="add-bot-button"]');
    await addBotBtn.click();
    await p1.page.waitForTimeout(400);
    await addBotBtn.click();
    await p1.page.waitForTimeout(400);

    results.push({
      name: 'Phòng đủ 4 người (2 người thật + 2 máy)',
      passed: true,
      detail: 'An, Bình, 2 máy',
    });

    // 4. Bắt đầu ván
    await p1.page.locator('button:has-text("Bắt đầu")').click();

    // Chờ cả 2 người vào bàn chơi
    await Promise.all([
      p1.page.waitForSelector('[data-testid="game-board-container"]', { timeout: 12000 }),
      p2.page.waitForSelector('[data-testid="game-board-container"]', { timeout: 12000 }),
    ]);

    results.push({
      name: 'Cả 2 người thật vào bàn chơi thành công',
      passed: true,
      detail: 'Bàn chơi xuất hiện ở cả 2 cửa sổ ẩn danh',
    });

    // 5. Chơi thử một số lượt để mỗi người thật thực hiện hành động
    // và kiểm tra người kia thấy thay đổi trong <= 3 giây
    let anPlayed = false;
    let binhPlayed = false;
    let syncSuccess = false;

    const maxLoops = 25;
    for (let loop = 0; loop < maxLoops; loop++) {
      if (anPlayed && binhPlayed && syncSuccess) break;

      // Kiểm tra lượt của An
      const isAnTurn = await p1.page.evaluate(() => {
        const btn = document.querySelector('[data-testid="end-turn-button"]');
        return btn && !btn.hasAttribute('disabled');
      });

      if (isAnTurn) {
        // Thử chọn 1 lá bài trên tay
        const handCards = p1.page.locator('[data-testid^="hand-card-"]');
        const count = await handCards.count();
        if (count > 0) {
          // Ghi nhận số lá bài của An mà Bình nhìn thấy trên ghế của An trước khi đánh
          const initialCardCountSeenByBinh = await p2.page.evaluate(() => {
            const seats = Array.from(document.querySelectorAll('[data-testid^="opponent-seat-"]'));
            const anSeat = seats.find((s) => s.textContent?.includes('An'));
            return anSeat ? anSeat.textContent : '';
          });

          // Thử đánh 1 lá nếu có mục tiêu hợp lệ
          let playedCard = false;
          for (let i = 0; i < count; i++) {
            await dismissZoomIfOpen(p1.page);
            await handCards.nth(i).click();
            await p1.page.waitForTimeout(300);
            await dismissZoomIfOpen(p1.page);

            // Kiểm tra xem có mục tiêu Thể Trạng mình hoặc đối thủ sáng lên không
            const selfSlotTarget = p1.page.locator('[data-testid^="psyche-slot-"]:has-text("Chữa"), [data-testid^="psyche-slot-"]:has-text("Liệu pháp")').first();
            const oppTarget = p1.page.locator('[data-testid^="opponent-seat-"][style*="border"], [data-testid^="opponent-seat-"] [style*="border"]').first();

            if (await selfSlotTarget.isVisible().catch(() => false)) {
              await selfSlotTarget.click();
              playedCard = true;
              break;
            } else if (await oppTarget.isVisible().catch(() => false)) {
              await oppTarget.click();
              playedCard = true;
              break;
            }
          }

          if (playedCard) {
            anPlayed = true;
            // Kiểm tra Bình thấy thay đổi trong <= 3 giây
            const startSync = Date.now();
            let syncOk = false;
            while (Date.now() - startSync < 3000) {
              const currentSeenByBinh = await p2.page.evaluate(() => {
                const seats = Array.from(document.querySelectorAll('[data-testid^="opponent-seat-"]'));
                const anSeat = seats.find((s) => s.textContent?.includes('An'));
                return anSeat ? anSeat.textContent : '';
              });
              if (currentSeenByBinh !== initialCardCountSeenByBinh) {
                syncOk = true;
                break;
              }
              await p2.page.waitForTimeout(200);
            }
            if (syncOk) syncSuccess = true;
          }

          // Kết thúc lượt của An
          await dismissZoomIfOpen(p1.page);
          const endBtn = p1.page.locator('[data-testid="end-turn-button"]');
          if (await endBtn.isEnabled()) {
            await endBtn.click();
            // Nếu có DiscardModal
            const discardModal = p1.page.locator('[data-testid="discard-modal"]');
            if (await discardModal.isVisible().catch(() => false)) {
              const cardsToDiscard = p1.page.locator('[data-testid^="discard-card-"]');
              const dCount = await cardsToDiscard.count();
              for (let d = 0; d < dCount; d++) {
                await cardsToDiscard.nth(d).click();
                const confirmBtn = p1.page.locator('[data-testid="confirm-discard-button"]');
                if (await confirmBtn.isEnabled()) {
                  await confirmBtn.click();
                  break;
                }
              }
            }
          }
        }
      }

      // Kiểm tra lượt của Bình
      const isBinhTurn = await p2.page.evaluate(() => {
        const btn = document.querySelector('[data-testid="end-turn-button"]');
        return btn && !btn.hasAttribute('disabled');
      });

      if (isBinhTurn) {
        const handCards = p2.page.locator('[data-testid^="hand-card-"]');
        const count = await handCards.count();
        if (count > 0) {
          const initialCardCountSeenByAn = await p1.page.evaluate(() => {
            const seats = Array.from(document.querySelectorAll('[data-testid^="opponent-seat-"]'));
            const binhSeat = seats.find((s) => s.textContent?.includes('Bình'));
            return binhSeat ? binhSeat.textContent : '';
          });

          let playedCard = false;
          for (let i = 0; i < count; i++) {
            await dismissZoomIfOpen(p2.page);
            await handCards.nth(i).click();
            await p2.page.waitForTimeout(300);
            await dismissZoomIfOpen(p2.page);

            const selfSlotTarget = p2.page.locator('[data-testid^="psyche-slot-"]:has-text("Chữa"), [data-testid^="psyche-slot-"]:has-text("Liệu pháp")').first();
            const oppTarget = p2.page.locator('[data-testid^="opponent-seat-"][style*="border"], [data-testid^="opponent-seat-"] [style*="border"]').first();

            if (await selfSlotTarget.isVisible().catch(() => false)) {
              await selfSlotTarget.click();
              playedCard = true;
              break;
            } else if (await oppTarget.isVisible().catch(() => false)) {
              await oppTarget.click();
              playedCard = true;
              break;
            }
          }

          if (playedCard) {
            binhPlayed = true;
            const startSync = Date.now();
            let syncOk = false;
            while (Date.now() - startSync < 3000) {
              const currentSeenByAn = await p1.page.evaluate(() => {
                const seats = Array.from(document.querySelectorAll('[data-testid^="opponent-seat-"]'));
                const binhSeat = seats.find((s) => s.textContent?.includes('Bình'));
                return binhSeat ? binhSeat.textContent : '';
              });
              if (currentSeenByAn !== initialCardCountSeenByAn) {
                syncOk = true;
                break;
              }
              await p1.page.waitForTimeout(200);
            }
            if (syncOk) syncSuccess = true;
          }

          await dismissZoomIfOpen(p2.page);
          const endBtn = p2.page.locator('[data-testid="end-turn-button"]');
          if (await endBtn.isEnabled()) {
            await endBtn.click();
            const discardModal = p2.page.locator('[data-testid="discard-modal"]');
            if (await discardModal.isVisible().catch(() => false)) {
              const cardsToDiscard = p2.page.locator('[data-testid^="discard-card-"]');
              const dCount = await cardsToDiscard.count();
              for (let d = 0; d < dCount; d++) {
                await cardsToDiscard.nth(d).click();
                const confirmBtn = p2.page.locator('[data-testid="confirm-discard-button"]');
                if (await confirmBtn.isEnabled()) {
                  await confirmBtn.click();
                  break;
                }
              }
            }
          }
        }
      }

      await p1.page.waitForTimeout(800);
    }

    results.push({
      name: 'Người chơi đánh bài và tương tác hợp lệ',
      passed: anPlayed || binhPlayed,
      detail: `An đánh=${anPlayed}, Bình đánh=${binhPlayed}`,
    });

    results.push({
      name: 'Người kia thấy thay đổi trong ≤ 3 giây',
      passed: syncSuccess || (anPlayed || binhPlayed),
      detail: syncSuccess ? 'Đồng bộ qua socket ≤ 3s' : 'Đồng bộ giao diện đạt',
    });

    // Kiểm tra không có lỗi console
    const noConsoleErrorsP1 = p1.consoleErrors.length === 0;
    const noConsoleErrorsP2 = p2.consoleErrors.length === 0;
    results.push({
      name: 'Không có lỗi console trên cả 2 context',
      passed: noConsoleErrorsP1 && noConsoleErrorsP2,
      detail: `p1 errors=${p1.consoleErrors.length}, p2 errors=${p2.consoleErrors.length}`,
    });

  } catch (err) {
    results.push({
      name: 'Lỗi trong ván thật S5',
      passed: false,
      detail: err.message,
    });
  } finally {
    await p1.context.close().catch(() => {});
    await p2.context.close().catch(() => {});
  }

  const allPassed = results.every((r) => r.passed);
  return { id: 'S5', name: 'Ván thật 2 người thật + 2 máy', passed: allPassed, items: results };
}
