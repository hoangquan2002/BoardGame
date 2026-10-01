import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from './e2e/helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'gameplay_screenshots');

async function capture() {
  const browser = await launchBrowser();
  const baseUrl = 'http://localhost:3000';

  console.log('--- 1. Chụp ảnh Task R2: Nút & Tấm phủ Luật chơi ---');
  const rulesTargets = [
    { name: 'home', url: `${baseUrl}/`, btn: '[data-testid="rules-button"]' },
    { name: 'lobby', url: `${baseUrl}/?room=TESTROOM`, btn: '[data-testid="rules-button"]' },
    { name: 'game', url: `${baseUrl}/?mock=1&players=4&hand=8`, btn: '[data-testid="rules-button"]' },
  ];

  for (const t of rulesTargets) {
    for (const [w, h] of [[375, 667], [667, 375]]) {
      const page = await browser.newPage({
        viewport: { width: w, height: h },
        deviceScaleFactor: 2,
      });
      await page.goto(t.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      const btn = page.locator(t.btn).first();
      await btn.click();
      await page.waitForSelector('[data-testid="rules-sheet"]', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(500);

      const filePath = path.join(outDir, `r2_rules_${t.name}_${w}x${h}.png`);
      await page.screenshot({ path: filePath });
      console.log(`✓ Đã chụp: r2_rules_${t.name}_${w}x${h}.png`);
      await page.close();
    }
  }

  console.log('--- 2. Chụp lại bộ ảnh R1 sau khi tinh chỉnh Phần 1 ---');
  const r1Layouts = [
    { file: 'r1_375x667_p4_h8.png', w: 375, h: 667, p: 4, hand: 8 },
    { file: 'r1_375x667_p4_h12.png', w: 375, h: 667, p: 4, hand: 12 },
    { file: 'r1_390x844_p2_h4.png', w: 390, h: 844, p: 2, hand: 4 },
    { file: 'r1_390x844_p4_h8.png', w: 390, h: 844, p: 4, hand: 8 },
    { file: 'r1_667x375_p4_h8.png', w: 667, h: 375, p: 4, hand: 8 },
    { file: 'r1_844x390_p4_h8.png', w: 844, h: 390, p: 4, hand: 8 },
    { file: 'r1_1280x800_p4_h8.png', w: 1280, h: 800, p: 4, hand: 8 },
  ];

  for (const item of r1Layouts) {
    const page = await browser.newPage({
      viewport: { width: item.w, height: item.h },
      deviceScaleFactor: 2,
    });
    await page.goto(`${baseUrl}/?mock=1&players=${item.p}&hand=${item.hand}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    // Chọn 1 lá để làm nổi bật bố cục và mục tiêu
    const card = page.locator('[data-testid^="hand-card-"]').first();
    if (await card.isVisible()) {
      await card.click({ position: { x: 14, y: 30 } }).catch(() => {});
      await page.waitForTimeout(300);
    }

    const filePath = path.join(outDir, item.file);
    await page.screenshot({ path: filePath });
    console.log(`✓ Đã chụp: ${item.file}`);
    await page.close();
  }

  console.log('--- 3. Chụp lại zoom modal khít tỷ lệ 520/864 ---');
  for (const [w, h, name] of [
    [390, 844, 'r1_zoom_390x844.png'],
    [844, 390, 'r1_zoom_844x390.png'],
  ]) {
    const page = await browser.newPage({
      viewport: { width: w, height: h },
      deviceScaleFactor: 2,
    });
    await page.goto(`${baseUrl}/?mock=1&players=2&hand=4`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const card = page.locator('[data-testid^="hand-card-"]').first();
    const box = await card.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(600);
      await page.mouse.up();
      await page.waitForSelector('[data-testid="card-zoom"]', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(400);

      const filePath = path.join(outDir, name);
      await page.screenshot({ path: filePath });
      console.log(`✓ Đã chụp: ${name}`);
    }
    await page.close();
  }

  await browser.close();
  console.log('Hoàn thành chụp toàn bộ ảnh!');
}

capture().catch(console.error);
