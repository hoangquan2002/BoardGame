import { newPlayer } from './helpers.mjs';

export async function runS3(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const { context, page } = await newPlayer(browser, { width: 390, height: 844 });
  const results = [];

  try {
    const webpRequests = [];
    page.on('request', (req) => {
      if (req.url().endsWith('.webp')) {
        webpRequests.push(req.url());
      }
    });

    await page.goto(`${cleanBase}/?mock=1&players=4&hand=8`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(500);

    // 1. Mọi <img> lá có naturalWidth > 0
    const cardImages = Array.from(await page.locator('img[src*="/cards/"]').all());
    let allImagesLoaded = cardImages.length > 0;
    for (const img of cardImages) {
      const naturalWidth = await img.evaluate((el) => el.naturalWidth);
      if (naturalWidth <= 0) {
        allImagesLoaded = false;
      }
    }
    results.push({
      name: 'Mọi <img> lá bài tải thành công (naturalWidth > 0)',
      passed: allImagesLoaded,
      detail: `Đã kiểm tra ${cardImages.length} ảnh lá bài`,
    });

    // 2. Không còn .webp lá cũ
    const noWebp = webpRequests.length === 0;
    results.push({
      name: 'Không tải hoặc tham chiếu bất kỳ file .webp lá bài cũ nào',
      passed: noWebp,
      detail: noWebp ? '0 file .webp' : `Tìm thấy: ${webpRequests.join(', ')}`,
    });

    // 3. Không còn chữ tiếng Anh ngoài tên thuốc / tên người
    const forbiddenPatterns = [
      /\bT\/CHỨNG\b/i,
      /\bL\/PHÁP\b/i,
      /\bdisorder#\d+/i,
      /\bdepression#\d+/i,
      /\banxiety#\d+/i,
      /\bEpisode Card\b/i,
      /\bTherapy Card\b/i,
      /\bDrug Card\b/i,
      /\bDisorder Card\b/i,
    ];

    const bodyText = await page.evaluate(() => document.body.innerText || '');
    let forbiddenMatch = null;
    for (const pat of forbiddenPatterns) {
      const m = bodyText.match(pat);
      if (m) {
        forbiddenMatch = m[0];
        break;
      }
    }

    results.push({
      name: 'Không còn chữ tiếng Anh hay id thô ngoài tên thuốc / tên người',
      passed: !forbiddenMatch,
      detail: forbiddenMatch ? `Vi phạm: "${forbiddenMatch}"` : '100% tiếng Việt hợp lệ',
    });
  } catch (err) {
    results.push({ name: 'Lỗi kiểm thử S3', passed: false, detail: err.message });
  } finally {
    await context.close();
  }

  const allPassed = results.every((r) => r.passed);
  return { id: 'S3', name: 'Kiểm tra ảnh bài sắc nét & dữ liệu chữ tiếng Việt', passed: allPassed, items: results };
}
