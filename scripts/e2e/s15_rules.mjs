import { newPlayer } from './helpers.mjs';

export async function runS15(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const testItems = [];
  let allPassed = true;

  const viewports = [
    { name: '320×568', width: 320, height: 568 },
    { name: '375×667', width: 375, height: 667 },
    { name: '667×375', width: 667, height: 375 },
    { name: '1280×800', width: 1280, height: 800 },
  ];

  // ================= 1. KIỂM TRA MỞ VÀ ĐÓNG LUẬT TRÊN 4 KÍCH THƯỚC (TRANG CHỦ) =================
  for (const vp of viewports) {
    const { context, page, consoleErrors } = await newPlayer(browser, { width: vp.width, height: vp.height });
    try {
      await page.goto(cleanBase, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(300);

      // Nút luật chơi thấy được ngay, không cuộn
      const rulesBtn = page.locator('[data-testid="rules-button"]').first();
      await rulesBtn.waitFor({ state: 'visible', timeout: 5000 });
      await rulesBtn.click();

      // rules-sheet hiện
      const rulesSheet = page.locator('[data-testid="rules-sheet"]');
      await rulesSheet.waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForFunction(() => {
        const imgs = Array.from(document.querySelectorAll('[data-testid="rules-sheet"] img'));
        return imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0);
      }, { timeout: 10000 }).catch(() => {});

      // Kiểm tra: trang không tràn ngang, đủ 8 bệnh lý, đủ 7 thuốc, mọi img naturalWidth > 0, font min >= 12px
      const checkResult = await page.evaluate(() => {
        const doc = document.documentElement;
        const noHOverflow = doc.scrollWidth <= window.innerWidth;

        const sheet = document.querySelector('[data-testid="rules-sheet"]');
        const text = sheet ? sheet.textContent || '' : '';

        const disorders = [
          'Lo âu', 'Chứng biếng ăn', 'Trầm cảm', 'Nghiện cờ bạc',
          'Liệt dương', 'Điên loạn', 'Suy nghĩ tự tử', 'Chứng run',
        ];
        const hasAllDisorders = disorders.every((d) => text.includes(d));

        const drugs = [
          'Chlorpromazine', 'Clozapine', 'Fluoxetine', 'Lithium',
          'Lorazepam', 'Pramipexole', 'Sildenafil',
        ];
        const hasAllDrugs = drugs.every((dr) => text.includes(dr));

        const allImgs = Array.from(sheet ? sheet.querySelectorAll('img') : []);
        const allImagesValid = allImgs.length > 0 && allImgs.every((img) => img.naturalWidth > 0);

        let minFontSize = 999;
        const allEls = sheet ? Array.from(sheet.querySelectorAll('*')) : [];
        for (const el of allEls) {
          if (el.textContent && el.textContent.trim().length > 0) {
            const fs = parseFloat(window.getComputedStyle(el).fontSize);
            if (!isNaN(fs) && fs > 0 && fs < minFontSize) {
              minFontSize = fs;
            }
          }
        }

        return {
          noHOverflow,
          hasAllDisorders,
          hasAllDrugs,
          allImagesValid,
          minFontSize: minFontSize === 999 ? 12 : minFontSize,
        };
      });

      // Đóng bằng nút đóng
      const closeBtn = page.locator('[data-testid="rules-close"]');
      await closeBtn.click();
      await rulesSheet.waitFor({ state: 'detached', timeout: 5000 });

      // Mở lại và đóng bằng phím Escape
      await rulesBtn.click();
      await rulesSheet.waitFor({ state: 'visible', timeout: 5000 });
      await page.keyboard.press('Escape');
      await rulesSheet.waitFor({ state: 'detached', timeout: 5000 });

      // Mở lại và đóng bằng page.goBack() (nút Back của điện thoại)
      await rulesBtn.click();
      await rulesSheet.waitFor({ state: 'visible', timeout: 5000 });
      await page.goBack();
      await rulesSheet.waitFor({ state: 'detached', timeout: 5000 });

      const passed =
        checkResult.noHOverflow &&
        checkResult.hasAllDisorders &&
        checkResult.hasAllDrugs &&
        checkResult.allImagesValid &&
        checkResult.minFontSize >= 12 &&
        consoleErrors.length === 0;

      if (!passed) allPassed = false;
      testItems.push({
        name: `Trang chủ: Luật chơi (${vp.name})`,
        passed,
        detail: `noHOverflow=${checkResult.noHOverflow}, 8Disorders=${checkResult.hasAllDisorders}, 7Drugs=${checkResult.hasAllDrugs}, imgsOk=${checkResult.allImagesValid}, minFont=${Math.round(checkResult.minFontSize)}px, đóng(Nút/Esc/Back)=OK`,
      });
    } catch (err) {
      allPassed = false;
      testItems.push({
        name: `Trang chủ: Luật chơi (${vp.name})`,
        passed: false,
        detail: err.message,
      });
    } finally {
      await context.close();
    }
  }

  // ================= 2. KIỂM TRA PHÒNG CHỜ (CHẤM NGƯỜI MỚI & F5) =================
  {
    const { context, page } = await newPlayer(browser, { width: 375, height: 667 });
    try {
      await page.goto(cleanBase, { waitUntil: 'networkidle', timeout: 15000 });
      const nameInput = page.locator('input[placeholder*="tên" i], input[type="text"]').first();
      await nameInput.fill('An Test Rules');
      await page.locator('button:has-text("Tạo phòng mới")').click();
      await page.waitForSelector('[data-testid="invite-url-input"]', { timeout: 15000 });
      await page.waitForTimeout(300);

      // 1. Kiểm tra chấm người mới có ở lần đầu
      const hasDotInitially = await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="rules-button"]');
        return Boolean(btn && btn.querySelector('span[style*="background-color"]'));
      });

      // 2. Mở luật chơi
      await page.locator('[data-testid="rules-button"]').click();
      await page.waitForSelector('[data-testid="rules-sheet"]', { timeout: 8000 });

      // 3. Đóng luật chơi
      await page.locator('[data-testid="rules-close"]').click();
      await page.waitForSelector('[data-testid="rules-sheet"]', { state: 'detached', timeout: 5000 });

      // 4. Kiểm tra chấm người mới đã mất
      const hasDotAfterOpen = await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="rules-button"]');
        return Boolean(btn && btn.querySelector('span[style*="background-color"]'));
      });

      // 5. F5 tải lại trang -> chấm vẫn mất
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('[data-testid="invite-url-input"]', { timeout: 15000 });
      await page.waitForTimeout(300);
      const hasDotAfterReload = await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="rules-button"]');
        return Boolean(btn && btn.querySelector('span[style*="background-color"]'));
      });

      const lobbyOk = hasDotInitially && !hasDotAfterOpen && !hasDotAfterReload;
      if (!lobbyOk) allPassed = false;

      testItems.push({
        name: 'Phòng chờ: Chấm người mới & lưu trạng thái đã đọc qua F5',
        passed: lobbyOk,
        detail: `chấmLầnĐầu=${hasDotInitially}, mấtSauKhiMở=${!hasDotAfterOpen}, vẫnMấtSauF5=${!hasDotAfterReload}`,
      });
    } catch (err) {
      allPassed = false;
      testItems.push({
        name: 'Phòng chờ: Chấm người mới & lưu trạng thái đã đọc qua F5',
        passed: false,
        detail: err.message,
      });
    } finally {
      await context.close();
    }
  }

  // ================= 3. BÀN CHƠI /?mock=1 (MỞ TỪ NÚT "?" VÀ MENU "⋯") =================
  {
    const { context, page } = await newPlayer(browser, { width: 390, height: 844 });
    try {
      await page.goto(`${cleanBase}/?mock=1`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForSelector('[data-testid="rules-button"]', { timeout: 8000 });

      // 1. Mở từ nút "?"
      await page.locator('[data-testid="rules-button"]').click();
      await page.waitForSelector('[data-testid="rules-sheet"]', { timeout: 5000 });
      await page.locator('[data-testid="rules-close"]').click();
      await page.waitForSelector('[data-testid="rules-sheet"]', { state: 'detached', timeout: 5000 });

      // 2. Mở từ mục trong menu ⋯
      await page.locator('[data-testid="menu-button"]').click();
      await page.waitForSelector('[data-testid="rules-menu-item"]', { timeout: 5000 });
      await page.locator('[data-testid="rules-menu-item"]').click();
      await page.waitForSelector('[data-testid="rules-sheet"]', { timeout: 5000 });
      await page.locator('[data-testid="rules-close"]').click();
      await page.waitForSelector('[data-testid="rules-sheet"]', { state: 'detached', timeout: 5000 });

      testItems.push({
        name: 'Bàn chơi (/?mock=1): Mở luật bằng cả nút "?" và menu ⋯',
        passed: true,
        detail: 'Nút "?" và menu-item đều mở và đóng luật thành công',
      });
    } catch (err) {
      allPassed = false;
      testItems.push({
        name: 'Bàn chơi (/?mock=1): Mở luật bằng cả nút "?" và menu ⋯',
        passed: false,
        detail: err.message,
      });
    } finally {
      await context.close();
    }
  }

  // ================= 4. BÀN CHƠI PHÒNG THẬT (CHỌN LÁ -> MỞ LUẬT -> ĐÓNG -> LÁ VẪN CHỌN, KHÔNG MẤT KẾT NỐI) =================
  {
    const { context, page } = await newPlayer(browser, { width: 390, height: 844 });
    try {
      await page.goto(cleanBase, { waitUntil: 'networkidle', timeout: 15000 });
      const nameInput = page.locator('input[placeholder*="tên" i], input[type="text"]').first();
      await nameInput.fill('An Real Rules');
      await page.locator('button:has-text("Tạo phòng mới")').click();
      await page.waitForSelector('[data-testid="invite-url-input"]', { timeout: 8000 });

      // Thêm 1 bot và bắt đầu
      await page.locator('button:has-text("Thêm máy")').click();
      await page.waitForTimeout(300);
      await page.locator('button:has-text("Bắt đầu")').click();
      await page.waitForSelector('[data-testid="game-board-container"]', { timeout: 10000 });

      // Đợi đến khi có lá bài trên tay và chọn lá trên cùng
      const handCard = page.locator('[data-testid^="hand-card-"]').last();
      await handCard.waitFor({ state: 'visible', timeout: 8000 });
      await handCard.click();
      await page.waitForTimeout(300);

      // Xác nhận lá đã được chọn
      const selectedInitially = await page.evaluate(() => {
        const el = document.querySelector('[data-testid^="hand-card-"][data-selected="true"]');
        return Boolean(el);
      });

      // Mở luật chơi
      await page.locator('[data-testid="rules-button"]').click();
      await page.waitForSelector('[data-testid="rules-sheet"]', { timeout: 5000 });

      // Đóng luật bằng page.goBack()
      await page.goBack();
      await page.waitForSelector('[data-testid="rules-sheet"]', { state: 'detached', timeout: 5000 });

      // Kiểm tra: lá vẫn được chọn sau khi đóng luật, và không hiện mất kết nối
      const checkAfterRules = await page.evaluate(() => {
        const isStillSelected = Boolean(document.querySelector('[data-testid^="hand-card-"][data-selected="true"]'));
        const bodyText = document.body.innerText || '';
        const noDisconnect = !bodyText.includes('mất kết nối') && !bodyText.includes('Đang kết nối lại');
        return { isStillSelected, noDisconnect };
      });

      const realRoomOk = selectedInitially && checkAfterRules.isStillSelected && checkAfterRules.noDisconnect;
      if (!realRoomOk) allPassed = false;

      testItems.push({
        name: 'Bàn chơi phòng thật: Chọn lá -> Mở luật -> Đóng -> Lá vẫn chọn & Kết nối ổn định',
        passed: realRoomOk,
        detail: `láĐãChọnBanĐầu=${selectedInitially}, láVẫnChọnSauKhiĐóng=${checkAfterRules.isStillSelected}, kếtNốiỔnĐịnh=${checkAfterRules.noDisconnect}`,
      });
    } catch (err) {
      allPassed = false;
      testItems.push({
        name: 'Bàn chơi phòng thật: Chọn lá -> Mở luật -> Đóng -> Lá vẫn chọn & Kết nối ổn định',
        passed: false,
        detail: err.message,
      });
    } finally {
      await context.close();
    }
  }

  const passedCount = testItems.filter((i) => i.passed).length;
  console.log(`\n========================================`);
  console.log(`KỊCH BẢN S15: KIỂM TRA NÚT VÀ TẤM PHỦ LUẬT CHƠI (Task R2)`);
  console.log(`Kết quả: ${allPassed ? '✅ TẤT CẢ ĐẠT' : '❌ CÓ LỖI'} (${passedCount}/${testItems.length})`);
  console.log(`========================================\n`);

  for (const item of testItems) {
    console.log(`  ${item.passed ? '✓' : '✗'} ${item.name}: ${item.detail}`);
  }

  return {
    scenario: 'S15',
    name: 'Kiểm tra nút & tấm phủ Luật chơi (4 kích thước, Trang chủ, Phòng chờ, Bàn chơi)',
    passed: allPassed,
    passedCount,
    totalCount: testItems.length,
    items: testItems,
  };
}
