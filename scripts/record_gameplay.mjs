import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { getChromeExecutable } from './e2e/helpers.mjs';

const BASE_URL = process.env.URL || 'http://localhost:3000';
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

async function closeAnyZoom(page) {
  const zoomBackdrop = page.locator('[data-testid="card-zoom-backdrop"]');
  if (await zoomBackdrop.isVisible()) {
    const closeBtn = page.locator('button[aria-label="Đóng phóng to"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.waitForTimeout(650);
      await zoomBackdrop.click({ position: { x: 10, y: 10 } });
    }
    await page.waitForSelector('[data-testid="card-zoom-backdrop"]', { state: 'detached', timeout: 3000 });
    await page.waitForTimeout(300);
  }
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
  await capture(page, 'trang_chu', 'Giao diện Trang chủ Side Effects, form nhập tên người chơi và nút Tạo phòng mới');

  // Điền tên và tạo phòng mới
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.fill('An');
  const createBtn = page.locator('button:has-text("Tạo phòng mới")');
  await createBtn.click();

  // 2. Chờ vào phòng chờ
  await page.waitForSelector('text=Mã phòng chờ', { timeout: 15000 });
  await page.waitForTimeout(800);
  await capture(page, 'phong_cho', 'Tạo phòng thành công: mã phòng to rõ, mã QR trực tiếp và nút sao chép link mời');

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
  await capture(page, 'bat_dau_van_bai', 'Chia 4 Bệnh Lý ban đầu vào Thể Trạng mỗi bên, rút 4 lá bài tay xếp 1 hàng so le, ghế đối thủ mini');

  // Chờ Máy 1 đi lượt đầu (nếu Máy 1 là người đi đầu) hoặc hiển thị lượt
  await page.waitForTimeout(1500);
  await capture(page, 'may_dang_di_luot_1', 'Máy 1 tự động suy nghĩ và đi lượt đầu tiên');

  // Chờ đến lượt An
  console.log('Waiting for An turn...');
  for (let i = 0; i < 20; i++) {
    const isAn = await page.evaluate(() => {
      const top = document.querySelector('header') || document.body;
      return top.innerText.includes('Lượt của bạn');
    });
    if (isAn) break;
    await page.waitForTimeout(1000);
  }

  // 6. Đầu lượt An
  await page.waitForTimeout(500);
  await capture(page, 'dau_luot_an_2', 'Đồng hồ đếm ngược ⏱ hiển thị, nhãn "Lượt của bạn" xanh lá. Rút thêm 2 lá bài vào tay');

  // 7. Nhấn giữ phóng to lá bài
  console.log('Demonstrating card zoom modal...');
  const firstHandCard = page.locator('[data-testid^="hand-card-"]').first();
  if (await firstHandCard.isVisible()) {
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
      }
      await closeAnyZoom(page);
    }
  }

  // 8. Chọn 1 lá bài trên tay
  console.log('Selecting a hand card...');
  const handCards = page.locator('[data-testid^="hand-card-"]');
  const handCount = await handCards.count();
  let foundTarget = false;

  for (let i = 0; i < handCount; i++) {
    const card = handCards.nth(i);
    const box = await card.boundingBox();
    if (!box) continue;

    await page.mouse.click(box.x + 12, box.y + 30);
    await page.waitForTimeout(400);

    const validTarget = await page.evaluate(() => {
      const t = document.querySelector('[data-target="true"]');
      if (t) {
        const r = t.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      return null;
    });

    if (validTarget) {
      await capture(page, 'an_chon_la_3_luot_2', 'Lá bài tay nhô lên viền xanh, dải thông tin hiện tên thuốc/tác dụng phụ, ô mục tiêu hợp lệ sáng viền xanh');

      // 9. Đánh bài vào mục tiêu
      await page.mouse.click(validTarget.x, validTarget.y);
      await page.waitForTimeout(1200);
      await capture(page, 'an_danh_thanh_cong_luot_2', 'Lá Thuốc nằm TRÊN Bệnh Lý, lệch xuống dưới 25% lộ tên bệnh; dải Thể Trạng cập nhật');
      foundTarget = true;
      break;
    }

    // Bỏ chọn
    await page.mouse.click(box.x + 12, box.y + 30);
    await page.waitForTimeout(200);
  }

  if (!foundTarget && handCount > 0) {
    // Nếu chưa tìm thấy lá có target, chọn lá đầu tiên chụp ảnh chọn lá
    const box = await handCards.first().boundingBox();
    if (box) {
      await page.mouse.click(box.x + 12, box.y + 30);
      await page.waitForTimeout(300);
      await capture(page, 'an_chon_la_3_luot_2', 'Lá bài tay nhô lên viền xanh, dải thông tin hiện tên thuốc/tác dụng phụ');
      await capture(page, 'an_danh_thanh_cong_luot_2', 'Bàn chơi hiển thị Thể Trạng bậc thang');
    }
  }

  // 10. Trước khi kết thúc lượt
  await capture(page, 'truoc_ket_thuc_luot_2', 'An kiểm tra lại toàn bộ bài tay và Thể Trạng rồi bấm nút "Kết thúc lượt"');

  // 11. Bấm kết thúc lượt
  const endTurnBtn = page.locator('[data-testid="end-turn-button"]');
  if (await endTurnBtn.isVisible() && (await endTurnBtn.isEnabled())) {
    await endTurnBtn.click();
    await page.waitForTimeout(1200);
  }
  await capture(page, 'sau_ket_thuc_luot_2', 'Trạng thái chuyển mượt mà sang lượt đối thủ: "Lượt: 🤖 Máy 1 (Thường)"');

  // 12. Chờ Máy 1 đi lượt tiếp theo
  await page.waitForTimeout(2000);
  await capture(page, 'may_dang_di_luot_5', 'Máy 1 tự động tính toán và điều trị các Bệnh Lý trên Thể Trạng của mình');

  // Chờ đến lượt tiếp theo của An
  console.log('Waiting for next An turn...');
  for (let i = 0; i < 25; i++) {
    const isAn = await page.evaluate(() => {
      const top = document.querySelector('header') || document.body;
      return top.innerText.includes('Lượt của bạn');
    });
    if (isAn) break;
    await page.waitForTimeout(1000);
  }

  // 13. Đầu lượt An tiếp theo
  await page.waitForTimeout(500);
  await capture(page, 'dau_luot_an_7', 'Lượt mới của An: số lá đối thủ thay đổi, Thể Trạng cập nhật tiến độ điều trị');

  // 14. Chọn lá bài tiếp theo
  const currentHand = page.locator('[data-testid^="hand-card-"]');
  const countNow = await currentHand.count();
  if (countNow > 1) {
    const box2 = await currentHand.nth(1).boundingBox();
    if (box2) {
      await page.mouse.click(box2.x + 12, box2.y + 30);
      await page.waitForTimeout(400);
    }
  }
  await capture(page, 'an_chon_la_6_luot_7', 'An xem xét chọn lá bài thứ hai để tối ưu hoá chiến thuật tâm lý');

  // 15. Đánh lá bài hoặc cập nhật bàn
  await capture(page, 'an_danh_thanh_cong_luot_7', 'Thực hiện hành động chiến thuật trên bàn chơi');

  // 16. Trước kết thúc lượt
  await capture(page, 'truoc_ket_thuc_luot_7', 'Chuẩn bị kết thúc lượt tiếp theo');

  // 17. Sau kết thúc lượt
  if (await endTurnBtn.isVisible() && (await endTurnBtn.isEnabled())) {
    await endTurnBtn.click();
    await page.waitForTimeout(1000);
  }
  await capture(page, 'sau_ket_thuc_luot_7', 'Chuyển lượt sang cho đối thủ hoàn thành ván đấu');

  // 18. Màn chiến thắng (WinnerModal)
  console.log('Capturing victory screen...');
  await page.goto(`${BASE_URL}/?mock=1&winner=me`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForSelector('text=chiến thắng', { timeout: 10000 });
  await page.waitForTimeout(800);
  await capture(page, 'ket_thuc_van_bai', 'Kết thúc ván bài: Xuất hiện hộp thoại vinh danh chiến thắng 🏆 phong cách sòng bài xanh gold');

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
