import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { getChromeExecutable } from './e2e/helpers.mjs';

const BASE_URL = process.env.URL || 'https://boardgame-02k2.onrender.com';
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.resolve(process.cwd(), 'gameplay_screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let stepIndex = 0;
const capturedSteps = [];

async function capture(page, name, description) {
  stepIndex++;
  const paddedIndex = String(stepIndex).padStart(2, '0');
  const filename = `step_${paddedIndex}_${name}.png`;
  const filePath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[Captured] ${filename} - ${description}`);
  capturedSteps.push({
    index: stepIndex,
    filename,
    filePath,
    name,
    description,
    timestamp: new Date().toISOString(),
  });
  return filePath;
}

async function main() {
  console.log(`Starting gameplay recording on: ${BASE_URL}`);
  const executablePath = getChromeExecutable();
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();

  // 1. Mở trang chủ
  console.log('Navigating to homepage...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await capture(page, 'trang_chu', 'Mở trang chủ Side Effects trên Render');

  // Điền tên và tạo phòng mới
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.fill('An');
  const createBtn = page.locator('button:has-text("Tạo phòng mới")');
  await createBtn.click();

  // 2. Chờ vào phòng chờ
  await page.waitForSelector('text=Mã phòng chờ', { timeout: 15000 });
  await page.waitForTimeout(800);
  await capture(page, 'phong_cho', 'Tạo phòng thành công, giao diện phòng chờ kèm mã phòng & QR');

  // 3. Thêm máy
  console.log('Adding bot...');
  const addBotBtn = page.locator('[data-testid="add-bot-button"]');
  await addBotBtn.click();
  await page.waitForTimeout(1200);
  await capture(page, 'them_may', 'Đã thêm Máy 1 vào phòng chơi (đủ 2 người 1v1)');

  // 4. Bắt đầu trò chơi
  console.log('Starting game...');
  const startBtn = page.locator('button:has-text("Bắt đầu trò chơi")');
  await startBtn.click();

  // 5. Chờ bàn chơi hiển thị
  console.log('Waiting for game board to render...');
  await page.waitForSelector('[data-testid="end-turn-button"]', { timeout: 20000 });
  await page.waitForTimeout(1200);
  await capture(page, 'bat_dau_van_bai', 'Bàn chơi khởi tạo: chia 4 Bệnh Lý ban đầu vào Thể Trạng và rút 4 lá bài tay');

  let hasDemonstratedZoom = false;
  let turnCounter = 0;
  const maxLoops = 200;

  for (let loop = 0; loop < maxLoops; loop++) {
    await page.waitForTimeout(1000);

    // Kiểm tra ván bài đã kết thúc chưa
    const winnerDialog = await page.$('div[role="dialog"]:has-text("chiến thắng")');
    if (winnerDialog) {
      console.log('Game ended! Winner dialog detected.');
      await page.waitForTimeout(800);
      await capture(page, 'ket_thuc_van_bai', 'Ván bài kết thúc: Hộp thoại chiến thắng xuất hiện');
      break;
    }

    // Kiểm tra có PendingChoiceModal không (Lo âu, Chứng run)
    const choiceModal = await page.$('text=Lựa chọn của bạn');
    if (choiceModal) {
      await capture(page, 'hop_thoai_lua_chon', 'Xuất hiện hộp thoại lựa chọn (Lo âu / Chứng run)');
      const firstChoice = page.locator('button:has-text("Chọn"), button:has-text("Xác nhận")').first();
      if (await firstChoice.isVisible()) {
        await firstChoice.click();
        await page.waitForTimeout(600);
      }
      continue;
    }

    // Kiểm tra có DiscardModal không
    const discardModal = await page.$('text=Bỏ bài trên tay');
    if (discardModal) {
      await capture(page, 'hop_thoai_bo_bai', 'Bài trên tay vượt quá 6 lá, mở hộp thoại bỏ bớt bài');
      const cardsToDiscard = page.locator('div[role="dialog"] [data-testid^="card-"]');
      const count = await cardsToDiscard.count();
      for (let i = 0; i < Math.min(count, 2); i++) {
        await cardsToDiscard.nth(i).click();
      }
      const confirmDiscard = page.locator('button:has-text("Xác nhận bỏ")');
      if (await confirmDiscard.isVisible()) {
        await confirmDiscard.click();
        await page.waitForTimeout(600);
        await capture(page, 'sau_khi_bo_bai', 'Đã bỏ bài thừa về 6 lá');
      }
      continue;
    }

    // Đọc trạng thái lượt
    const headerText = await page.evaluate(() => {
      const topBar = document.querySelector('header') || document.body;
      return topBar.innerText || '';
    });

    const isMyTurn = headerText.includes('Lượt của bạn') || headerText.includes('Lượt: Bạn');
    const isBotTurn = headerText.includes('Máy 1') || headerText.includes('Máy');

    if (!isMyTurn && isBotTurn) {
      turnCounter++;
      if (turnCounter % 4 === 1) {
        await capture(page, `may_dang_di_luot_${turnCounter}`, `Đang trong lượt của đối thủ (Máy 1)`);
      }
      // Chờ bot suy nghĩ và thực hiện action
      await page.waitForTimeout(2000);
      continue;
    }

    if (isMyTurn) {
      turnCounter++;
      console.log(`--- Lượt của An (Turn #${turnCounter}) ---`);
      await capture(page, `dau_luot_an_${turnCounter}`, `Đến lượt An: xem các lá bài trên tay và Thể Trạng`);

      // Minh hoạ phóng to lá bài (Card Zoom Modal) 1 lần
      if (!hasDemonstratedZoom) {
        const firstHandCard = page.locator('[data-testid^="hand-card-"]').first();
        if (await firstHandCard.isVisible()) {
          console.log('Demonstrating card zoom modal...');
          const box = await firstHandCard.boundingBox();
          if (box) {
            const client = await page.context().newCDPSession(page);
            await client.send('Input.dispatchTouchEvent', {
              type: 'touchStart',
              touchPoints: [{ x: box.x + 20, y: box.y + 20 }],
            });
            await page.waitForTimeout(650);
            await client.send('Input.dispatchTouchEvent', {
              type: 'touchEnd',
              touchPoints: [],
            });
            await page.waitForTimeout(600);

            const zoomModal = await page.$('[data-testid="card-zoom-backdrop"]');
            if (zoomModal) {
              await capture(page, 'phong_to_la_bai', 'Nhấn giữ ≥400ms phóng to trọn vẹn lá bài thật từ PDF (520×864), chiếm ~90% màn hình, không chữ đè');
              const closeBtn = page.locator('button[aria-label="Đóng phóng to"]');
              if (await closeBtn.isVisible()) {
                await closeBtn.click();
              } else {
                await page.waitForTimeout(650);
                await page.locator('[data-testid="card-zoom-backdrop"]').click({ position: { x: 10, y: 10 } });
              }
              await page.waitForSelector('[data-testid="card-zoom-backdrop"]', { state: 'detached', timeout: 5000 });
              await page.waitForTimeout(300);
              hasDemonstratedZoom = true;
            }
          }
        }
      }

      // Đánh bài: thử duyệt qua các lá bài trên tay
      const handCards = page.locator('[data-testid^="hand-card-"]');
      const handCount = await handCards.count();

      for (let i = 0; i < handCount; i++) {
        const card = handCards.nth(i);
        const cardBox = await card.boundingBox();
        if (!cardBox) continue;

        // Chạm vào phần lộ ra bên trái của lá bài
        await page.mouse.click(cardBox.x + 12, cardBox.y + 30);
        await page.waitForTimeout(400);

        // Tìm mục tiêu hợp lệ trên trang
        const validAction = await page.evaluate(() => {
          const targetEl = document.querySelector('[data-target="true"]');
          if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            return {
              type: targetEl.getAttribute('data-testid') || 'target',
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            };
          }
          return null;
        });

        if (validAction) {
          console.log(`Found valid target: ${validAction.type}`);
          await capture(page, `an_chon_la_${i + 1}_luot_${turnCounter}`, `An chọn lá bài trên tay, mục tiêu hợp lệ được viền sáng`);
          await page.mouse.click(validAction.x, validAction.y);
          await page.waitForTimeout(1000);
          await capture(page, `an_danh_thanh_cong_luot_${turnCounter}`, `An thực hiện đánh bài thành công vào mục tiêu`);
          break; // Chỉ đánh 1 lá rồi kết thúc hoặc lặp tiếp
        }

        // Bỏ chọn nếu không có mục tiêu
        await page.mouse.click(cardBox.x + 12, cardBox.y + 30);
        await page.waitForTimeout(200);
      }

      // Đóng modal zoom nếu còn sót lại
      const openZoom = page.locator('[data-testid="card-zoom-backdrop"]');
      if (await openZoom.isVisible()) {
        const closeBtn = page.locator('button[aria-label="Đóng phóng to"]');
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        } else {
          await page.waitForTimeout(650);
          await openZoom.click({ position: { x: 10, y: 10 } });
        }
        await page.waitForSelector('[data-testid="card-zoom-backdrop"]', { state: 'detached', timeout: 3000 });
      }

      // Kết thúc lượt
      console.log('Ending turn for An...');
      const endTurnBtn = page.locator('[data-testid="end-turn-button"]');
      if (await endTurnBtn.isVisible()) {
        const isEnabled = await endTurnBtn.isEnabled();
        if (isEnabled) {
          await capture(page, `truoc_ket_thuc_luot_${turnCounter}`, `An bấm nút "Kết thúc lượt"`);
          await endTurnBtn.click();
          await page.waitForTimeout(1000);
          await capture(page, `sau_ket_thuc_luot_${turnCounter}`, `Đã kết thúc lượt của An, chuyển lượt sang cho đối thủ`);
        }
      }
    }
  }

  await browser.close();
  console.log(`\nRecording completed! Total steps captured: ${capturedSteps.length}`);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'summary.json'),
    JSON.stringify(capturedSteps, null, 2),
    'utf-8',
  );
}

main().catch((err) => {
  console.error('Recording error:', err);
  process.exit(1);
});
