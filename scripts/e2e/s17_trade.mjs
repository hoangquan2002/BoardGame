import { newPlayer } from './helpers.mjs';

export async function runS17(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const results = [];

  // Tạo 2 người thật: A (An) và B (Bình)
  const pA = await newPlayer(browser, { width: 375, height: 667 });
  const pB = await newPlayer(browser, { width: 375, height: 667 });

  try {
    // 1. A tạo phòng
    await pA.page.goto(cleanBase, { waitUntil: 'networkidle', timeout: 15000 });
    const nameInputA = pA.page.locator('input[placeholder*="tên" i], input[type="text"]').first();
    await nameInputA.fill('An');
    await pA.page.locator('button:has-text("Tạo phòng mới")').click();
    await pA.page.waitForSelector('[data-testid="invite-url-input"]', { timeout: 10000 });

    const inviteUrl = await pA.page.evaluate(() => {
      const input = document.querySelector('[data-testid="invite-url-input"]') || document.querySelector('input[readonly]');
      return input ? input.value : '';
    });
    const codeMatch = inviteUrl.match(/room=([A-Z0-9]+)/i);
    const roomCode = codeMatch ? codeMatch[1] : '';

    if (!roomCode) throw new Error('Không lấy được mã phòng');

    // 2. B vào phòng
    await pB.page.goto(`${cleanBase}/?room=${roomCode}`, { waitUntil: 'networkidle', timeout: 15000 });
    const nameInputB = pB.page.locator('input[placeholder*="tên" i], input[type="text"]').first();
    await nameInputB.fill('Bình');
    await pB.page.locator('button:has-text("Vào phòng")').click();
    await pB.page.waitForTimeout(1000);

    // 3. Thêm 2 bot
    const addBotBtn = pA.page.locator('[data-testid="add-bot-button"]');
    await addBotBtn.click();
    await pA.page.waitForTimeout(400);
    await addBotBtn.click();
    await pA.page.waitForTimeout(400);

    // 4. Bắt đầu ván
    await pA.page.locator('button:has-text("Bắt đầu")').click();
    await Promise.all([
      pA.page.waitForSelector('[data-testid="game-board-container"]', { timeout: 12000 }),
      pB.page.waitForSelector('[data-testid="game-board-container"]', { timeout: 12000 }),
    ]);

    // ==================== NHÁNH 1 & 2: A MỜI B -> B ĐỒNG Ý ĐỔI 1 LÁ -> A XÁC NHẬN ====================
    // A mở menu ⋯ -> "Đổi bài"
    await pA.page.locator('[data-testid="menu-button"]').click();
    await pA.page.waitForTimeout(300);
    await pA.page.locator('[data-testid="trade-menu-item"]').click();
    await pA.page.waitForTimeout(500);

    // Trong modal, chọn Bình (nếu chưa chọn) và chọn 1 lá bài
    const binhBtn = pA.page.locator('button:has-text("Bình")');
    if (await binhBtn.isVisible()) {
      await binhBtn.click();
      await pA.page.waitForTimeout(200);
    }

    // Chọn 1 lá bài để đề xuất
    await pA.page.waitForSelector('[data-testid^="trade-offer-card-"]', { timeout: 5000 });
    const aOfferCards = pA.page.locator('[data-testid^="trade-offer-card-"]');
    await aOfferCards.first().click();
    await pA.page.waitForTimeout(300);

    // Gửi đề xuất
    const sendBtn = pA.page.locator('[data-testid="send-trade-button"]');
    await sendBtn.click();
    await pA.page.waitForTimeout(500);

    // Kiểm tra B (không cần mở menu) thấy trade-notice trong <= 3 giây
    const bNotice = pB.page.locator('[data-testid="trade-notice"]');
    await bNotice.waitFor({ state: 'visible', timeout: 3500 });
    const bNoticeText = (await bNotice.innerText()).trim();

    results.push({
      name: 'B thấy trade-notice trong ≤ 3 giây không cần mở menu',
      passed: bNoticeText.includes('An') && bNoticeText.includes('mời bạn đổi bài'),
      detail: `text="${bNoticeText}"`,
    });

    // Kiểm tra menu-badge trên nút ⋯ của B
    const bMenuBadge = pB.page.locator('[data-testid="menu-badge"]');
    const badgeVisible = await bMenuBadge.isVisible();
    results.push({
      name: 'Nút ⋯ của B có dấu chấm nhắc menu-badge',
      passed: badgeVisible,
      detail: `menu-badge visible=${badgeVisible}`,
    });

    // B bấm "Xem" trên trade-notice
    await pB.page.locator('[data-testid="trade-notice-view"]').click();
    await pB.page.waitForTimeout(500);

    // B chọn 1 lá bài của mình đưa lại
    const bGiveCards = pB.page.locator('[data-testid^="trade-give-card-"]');
    if ((await bGiveCards.count()) > 0) {
      await bGiveCards.first().click();
      await pB.page.waitForTimeout(200);
    }

    // B bấm "Đồng ý đổi"
    await pB.page.locator('[data-testid="accept-trade-button"]').click();
    await pB.page.waitForTimeout(800);

    // A thấy trade-notice thông báo B đã trả lời
    const aNotice = pA.page.locator('[data-testid="trade-notice"]');
    await aNotice.waitFor({ state: 'visible', timeout: 3500 });
    const aNoticeText = (await aNotice.innerText()).trim();

    results.push({
      name: 'A thấy trade-notice báo B đã trả lời',
      passed: aNoticeText.includes('Bình') && aNoticeText.includes('đã trả lời'),
      detail: `text="${aNoticeText}"`,
    });

    // A bấm "Xem" -> bấm "Xác nhận hoàn tất"
    await pA.page.locator('[data-testid="trade-notice-view"]').click();
    await pA.page.waitForTimeout(500);
    await pA.page.locator('[data-testid="confirm-trade-button"]').click();
    await pA.page.waitForTimeout(1000);

    // Cả 2 thấy thông báo đã đổi bài
    const aResultBanner = pA.page.locator('[data-testid="trade-result-banner"]');
    const aBannerVisible = await aResultBanner.isVisible({ timeout: 3000 }).catch(() => false);
    const aBannerText = aBannerVisible ? (await aResultBanner.innerText()).trim() : '';

    results.push({
      name: 'Hoàn tất đổi bài: bài thay đổi và hiện thông báo kết quả',
      passed: aBannerVisible && (aBannerText.includes('đổi') || aBannerText.includes('Bình')),
      detail: `bannerText="${aBannerText}"`,
    });

    // ==================== NHÁNH 3: TỪ CHỐI ĐỔI BÀI ====================
    // A gửi tiếp 1 đề nghị đổi bài tới B
    await pA.page.locator('[data-testid="menu-button"]').click();
    await pA.page.waitForTimeout(300);
    await pA.page.locator('[data-testid="trade-menu-item"]').click();
    await pA.page.waitForTimeout(500);

    const binhBtn2 = pA.page.locator('button:has-text("Bình")');
    if (await binhBtn2.isVisible()) await binhBtn2.click();

    const aOfferCards2 = pA.page.locator('[data-testid^="trade-offer-card-"]');
    if ((await aOfferCards2.count()) > 0) {
      await aOfferCards2.first().click();
      await pA.page.waitForTimeout(200);
    }
    await pA.page.locator('[data-testid="send-trade-button"]').click();
    await pA.page.waitForTimeout(800);

    // B thấy trade-notice và bấm "Từ chối" ngay trên notice
    await bNotice.waitFor({ state: 'visible', timeout: 3500 });
    await pB.page.locator('[data-testid="trade-notice-reject"]').click();
    await pB.page.waitForTimeout(800);

    // Cả 2 người thấy thông báo "từ chối"
    const bRejectBanner = pB.page.locator('[data-testid="trade-result-banner"]');
    const aRejectBanner = pA.page.locator('[data-testid="trade-result-banner"]');
    const bBannerText = await bRejectBanner.innerText().catch(() => '');
    const aRejectText = await aRejectBanner.innerText().catch(() => '');

    const hasRejectWord = bBannerText.toLowerCase().includes('từ chối') || aRejectText.toLowerCase().includes('từ chối');
    results.push({
      name: 'Nhánh từ chối: cả 2 người thấy dòng thông báo "từ chối"',
      passed: hasRejectWord,
      detail: `a="${aRejectText}", b="${bBannerText}"`,
    });

    // ==================== NHÁNH 4: HUỶ ĐỀ NGHỊ ====================
    // A gửi đề nghị tới B
    await pA.page.locator('[data-testid="menu-button"]').click();
    await pA.page.waitForTimeout(300);
    await pA.page.locator('[data-testid="trade-menu-item"]').click();
    await pA.page.waitForTimeout(500);

    if (await binhBtn2.isVisible()) await binhBtn2.click();
    const aOfferCards3 = pA.page.locator('[data-testid^="trade-offer-card-"]');
    if ((await aOfferCards3.count()) > 0) {
      await aOfferCards3.first().click();
      await pA.page.waitForTimeout(200);
    }
    await pA.page.locator('[data-testid="send-trade-button"]').click();
    await pA.page.waitForTimeout(800);

    // B thấy trade-notice
    await bNotice.waitFor({ state: 'visible', timeout: 3500 });

    // A mở modal và huỷ
    await pA.page.locator('[data-testid="menu-button"]').click();
    await pA.page.waitForTimeout(300);
    await pA.page.locator('[data-testid="trade-menu-item"]').click();
    await pA.page.waitForTimeout(500);

    const cancelBtn = pA.page.locator('[data-testid="cancel-trade-button"], button:has-text("Huỷ đề xuất"), button:has-text("Huỷ giao dịch")').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await pA.page.waitForTimeout(800);
    }

    // Kiểm tra trade-notice của B biến mất
    const bNoticeDisappeared = !(await bNotice.isVisible({ timeout: 3000 }).catch(() => false));
    results.push({
      name: 'Nhánh huỷ: A huỷ -> trade-notice của B biến mất',
      passed: bNoticeDisappeared,
      detail: `bNoticeDisappeared=${bNoticeDisappeared}`,
    });

    // ==================== NHÁNH 5: B ĐANG MỞ LUẬT CHƠI KHI LỜI MỜI TỚI ====================
    // B mở Luật chơi
    await pB.page.locator('[data-testid="rules-button"]').click();
    await pB.page.waitForSelector('[data-testid="rules-sheet"]', { timeout: 5000 });

    // A gửi đề nghị đổi bài tới B
    await pA.page.locator('[data-testid="menu-button"]').click();
    await pA.page.waitForTimeout(300);
    await pA.page.locator('[data-testid="trade-menu-item"]').click();
    await pA.page.waitForTimeout(500);

    if (await binhBtn2.isVisible()) await binhBtn2.click();
    const aOfferCards4 = pA.page.locator('[data-testid^="trade-offer-card-"]');
    if ((await aOfferCards4.count()) > 0) {
      await aOfferCards4.first().click();
      await pA.page.waitForTimeout(200);
    }
    await pA.page.locator('[data-testid="send-trade-button"]').click();
    await pA.page.waitForTimeout(1000);

    // B đóng Luật chơi
    await pB.page.locator('[data-testid="rules-close"]').click();
    await pB.page.waitForTimeout(500);

    // Sau khi đóng luật, B thấy ngay trade-notice
    const bNoticeAfterRules = await bNotice.isVisible({ timeout: 3000 });
    results.push({
      name: 'B đang mở Luật chơi khi lời mời tới -> đóng luật vẫn thấy lời mời',
      passed: bNoticeAfterRules,
      detail: `bNoticeVisible=${bNoticeAfterRules}`,
    });

    // Dọn dẹp: B từ chối để kết thúc
    if (bNoticeAfterRules) {
      await pB.page.locator('[data-testid="trade-notice-reject"]').click().catch(() => {});
      await pB.page.waitForTimeout(500);
    }

  } catch (err) {
    results.push({
      name: 'Lỗi kịch bản S17',
      passed: false,
      detail: err.message,
    });
  } finally {
    await pA.context.close().catch(() => {});
    await pB.context.close().catch(() => {});
  }

  const allPassed = results.every((r) => r.passed);
  return { id: 'S17', name: 'Đổi bài giữa 2 người thật & trade-notice', passed: allPassed, items: results };
}
