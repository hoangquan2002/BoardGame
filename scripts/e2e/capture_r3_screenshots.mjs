import { launchBrowser } from './helpers.mjs';
import path from 'node:path';
import fs from 'node:fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUT_DIR = path.resolve('gameplay_screenshots');

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const browser = await launchBrowser({ headed: false });

  try {
    console.log('1. Đang chụp r3_1280x800_p2_h4.png...');
    const ctxDesktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pageDesktop = await ctxDesktop.newPage();
    await pageDesktop.goto(`${BASE_URL}/?mock=1&players=2&hand=4`, { waitUntil: 'networkidle' });
    await pageDesktop.waitForSelector('[data-testid="game-board-container"]');
    await pageDesktop.waitForTimeout(500);
    await pageDesktop.screenshot({ path: path.join(OUT_DIR, 'r3_1280x800_p2_h4.png') });
    await ctxDesktop.close();

    console.log('2. Đang chụp r3_end_turn_8_cards_375x667.png...');
    const ctxHand8 = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const pageHand8 = await ctxHand8.newPage();
    await pageHand8.goto(`${BASE_URL}/?mock=1&players=2&hand=8&turn=me`, { waitUntil: 'networkidle' });
    await pageHand8.waitForSelector('[data-testid="end-turn-button"]');
    await pageHand8.waitForTimeout(500);
    await pageHand8.screenshot({ path: path.join(OUT_DIR, 'r3_end_turn_8_cards_375x667.png') });

    console.log('3. Đang chụp r3_discard_modal_375x667.png...');
    const endBtn = pageHand8.locator('[data-testid="end-turn-button"]');
    await endBtn.click();
    await pageHand8.waitForSelector('[data-testid="discard-modal"]');
    const firstDiscardCard = pageHand8.locator('[data-testid^="discard-card-"]').first();
    await firstDiscardCard.click();
    await pageHand8.waitForTimeout(300);
    await pageHand8.screenshot({ path: path.join(OUT_DIR, 'r3_discard_modal_375x667.png') });
    await ctxHand8.close();

    console.log('4. Đang chụp r3_discard_modal_667x375.png...');
    const ctxLandscape = await browser.newContext({ viewport: { width: 667, height: 375 } });
    const pageLandscape = await ctxLandscape.newPage();
    await pageLandscape.goto(`${BASE_URL}/?mock=1&players=2&hand=8&turn=me`, { waitUntil: 'networkidle' });
    await pageLandscape.waitForSelector('[data-testid="end-turn-button"]');
    await pageLandscape.locator('[data-testid="end-turn-button"]').click();
    await pageLandscape.waitForSelector('[data-testid="discard-modal"]');
    await pageLandscape.locator('[data-testid^="discard-card-"]').first().click();
    await pageLandscape.waitForTimeout(300);
    await pageLandscape.screenshot({ path: path.join(OUT_DIR, 'r3_discard_modal_667x375.png') });
    await ctxLandscape.close();

    console.log('5. Đang chụp r3_trade_notice_375x667.png (ván thật An mời Bình đổi bài)...');
    const ctxAn = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const ctxBinh = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const pageAn = await ctxAn.newPage();
    const pageBinh = await ctxBinh.newPage();

    // An tạo phòng
    await pageAn.goto(BASE_URL, { waitUntil: 'networkidle' });
    await pageAn.locator('input[type="text"]').first().fill('An');
    await pageAn.locator('button:has-text("Tạo phòng mới")').click();
    await pageAn.waitForSelector('[data-testid="invite-url-input"]');
    const inviteUrl = await pageAn.locator('[data-testid="invite-url-input"]').inputValue();
    const roomCode = inviteUrl.match(/room=([A-Z0-9]+)/i)?.[1] || '';

    // Bình vào phòng
    await pageBinh.goto(`${BASE_URL}/?room=${roomCode}`, { waitUntil: 'networkidle' });
    await pageBinh.locator('input[type="text"]').first().fill('Bình');
    await pageBinh.locator('button:has-text("Vào phòng")').click();
    await pageBinh.waitForTimeout(600);

    // An bắt đầu ván
    await pageAn.locator('button:has-text("Bắt đầu")').click();
    await Promise.all([
      pageAn.waitForSelector('[data-testid="game-board-container"]'),
      pageBinh.waitForSelector('[data-testid="game-board-container"]'),
    ]);

    // An mở menu ⋯ -> bấm Đổi bài
    await pageAn.locator('[data-testid="menu-button"]').click();
    await pageAn.waitForTimeout(300);
    await pageAn.locator('[data-testid="trade-menu-item"]').click();
    await pageAn.waitForTimeout(500);

    // Trong modal, chọn Bình (nếu chưa chọn) và chọn 1 lá bài
    const binhBtn = pageAn.locator('button:has-text("Bình")');
    if (await binhBtn.isVisible()) {
      await binhBtn.click();
      await pageAn.waitForTimeout(200);
    }

    // Chọn 1 lá bài để đề xuất
    await pageAn.waitForSelector('[data-testid^="trade-offer-card-"]', { timeout: 5000 });
    const aOfferCards = pageAn.locator('[data-testid^="trade-offer-card-"]');
    await aOfferCards.first().click();
    await pageAn.waitForTimeout(300);

    // An gửi đề xuất
    const sendBtn = pageAn.locator('[data-testid="send-trade-button"]');
    await sendBtn.click();
    await pageAn.waitForTimeout(500);

    // Chờ Bình thấy trade-notice và dấu chấm menu-badge
    await pageBinh.waitForSelector('[data-testid="trade-notice"]', { timeout: 8000 });
    await pageBinh.waitForSelector('[data-testid="menu-badge"]', { timeout: 8000 });
    await pageBinh.waitForTimeout(400);

    await pageBinh.screenshot({ path: path.join(OUT_DIR, 'r3_trade_notice_375x667.png') });

    await ctxAn.close();
    await ctxBinh.close();

    console.log('✅ Đã chụp đầy đủ 5 ảnh nghiệm thu Task R3 thành công!');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Lỗi khi chụp ảnh:', err);
  process.exit(1);
});
