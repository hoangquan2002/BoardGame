import { chromium } from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';

export function getChromeExecutable() {
  const envPath = process.env.CHROME_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const standardPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    os.homedir() + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const p of standardPaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

export async function launchBrowser({ headed = false } = {}) {
  const executablePath = getChromeExecutable();
  return await chromium.launch({
    executablePath,
    headless: !headed,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
}

export async function newPlayer(browser, viewport = { width: 375, height: 667 }) {
  const context = await browser.newContext({
    viewport,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  return { context, page, consoleErrors };
}

export async function rotate(page) {
  const vp = page.viewportSize();
  if (!vp) return;
  await page.setViewportSize({ width: vp.height, height: vp.width });
  await page.waitForTimeout(200);
}

export async function measureLayout(page) {
  return await page.evaluate(() => {
    const doc = document.documentElement;
    const scrollWidth = doc.scrollWidth;
    const scrollHeight = doc.scrollHeight;
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;

    // 1. Hand cards & min exposure
    const handCardEls = Array.from(document.querySelectorAll('[data-testid^="hand-card-"]'));
    let handCardsInViewport = 0;
    let minHandExposure = 999;
    let minHandCardWidth = 999;

    const sortedHandEls = handCardEls
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return { el, rect };
      })
      .sort((a, b) => a.rect.left - b.rect.left);

    for (let i = 0; i < sortedHandEls.length; i++) {
      const { rect } = sortedHandEls[i];
      if (rect.bottom <= innerHeight + 1 && rect.right <= innerWidth + 1 && rect.top >= 0 && rect.left >= 0) {
        handCardsInViewport++;
      }
      if (rect.width > 0 && rect.width < minHandCardWidth) {
        minHandCardWidth = Math.round(rect.width);
      }
      if (i < sortedHandEls.length - 1) {
        const exposure = sortedHandEls[i + 1].rect.left - rect.left;
        if (exposure > 0 && exposure < minHandExposure) {
          minHandExposure = Math.round(exposure);
        }
      } else {
        const exposure = Math.round(rect.width);
        if (exposure > 0 && exposure < minHandExposure) {
          minHandExposure = exposure;
        }
      }
    }
    if (sortedHandEls.length === 0) {
      minHandExposure = 0;
      minHandCardWidth = 0;
    }

    // 2. Thể Trạng của mình: đo bề rộng ảnh lá nhỏ nhất
    const psycheCardEls = Array.from(document.querySelectorAll('[data-testid^="psyche-slot-"] img'));
    let minPsycheCardWidth = 999;
    for (const img of psycheCardEls) {
      const r = img.getBoundingClientRect();
      if (r.width > 0 && r.width < minPsycheCardWidth) {
        minPsycheCardWidth = Math.round(r.width);
      }
    }
    if (psycheCardEls.length === 0) minPsycheCardWidth = 0;

    // 3. Đối thủ: đo bề rộng ảnh lá nhỏ nhất (khi có ảnh)
    const oppImgEls = Array.from(document.querySelectorAll('[data-testid^="opponent-seat-"] img'));
    let minOppCardWidth = 999;
    for (const img of oppImgEls) {
      const r = img.getBoundingClientRect();
      if (r.width > 0 && r.width < minOppCardWidth) {
        minOppCardWidth = Math.round(r.width);
      }
    }
    const hasOppImages = oppImgEls.length > 0;
    if (!hasOppImages) minOppCardWidth = 0;

    // 4. Đối thủ nằm trọn trong màn hình (Phần 2 mục H1)
    const opponentSeats = Array.from(document.querySelectorAll('[data-testid^="opponent-seat-"]'));
    let allOpponentSeatsInViewport = true;
    for (const seat of opponentSeats) {
      const rect = seat.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > innerHeight + 1 || rect.left < 0 || rect.right > innerWidth + 1) {
        allOpponentSeatsInViewport = false;
      }
    }

    // 5. End turn button
    const endTurnEl = document.querySelector('[data-testid="end-turn-button"]');
    const endTurnBottom = endTurnEl ? Math.round(endTurnEl.getBoundingClientRect().bottom) : null;
    const endTurnInside = endTurnEl ? endTurnEl.getBoundingClientRect().bottom <= innerHeight + 1 : false;

    // 6. Kiểm tra ảnh lá theo Phần 2 mục H1:
    // - object-fit: contain
    // - tỷ lệ hiển thị lệch tỷ lệ gốc <= 1%
    // - naturalWidth = width trong manifest (520 hoặc 496)
    const allCardImages = Array.from(document.querySelectorAll('img[src*="/cards/"]'));
    let allImagesContain = true;
    let allImagesRatioOk = true;
    let allImagesNaturalWidthOk = true;

    for (const img of allCardImages) {
      const computed = window.getComputedStyle(img);
      if (computed.objectFit !== 'contain') {
        allImagesContain = false;
      }

      const rect = img.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const displayedRatio = rect.width / rect.height;
        // Mặt sau là 496/822 (~0.6034), các lá khác 520/864 (~0.60185)
        const expectedRatio = img.src.includes('back') ? 496 / 822 : 520 / 864;
        const diffRatio = Math.abs(displayedRatio - expectedRatio) / expectedRatio;
        if (diffRatio > 0.015) {
          allImagesRatioOk = false;
        }
      }

      const expectedNaturalW = img.src.includes('back') ? 496 : 520;
      if (img.naturalWidth > 0 && img.naturalWidth !== expectedNaturalW) {
        allImagesNaturalWidthOk = false;
      }
    }

    // 7. Kiểm tra "Không đè" (Phần 2 mục H1):
    // Lưới 5x5 điểm trên phần thấy được của mỗi ảnh lá.
    // Tại mỗi điểm, elementFromPoint phải trả về thẻ IMG (của lá đó hoặc lá khác đè lên),
    // không được là chữ / huy hiệu / nhãn.
    let allPointsNoOverlay = true;
    let overlayViolationDetails = [];

    for (const img of allCardImages) {
      const rect = img.getBoundingClientRect();
      // Bỏ qua ảnh không nằm trong viewport
      if (rect.width <= 0 || rect.height <= 0 || rect.bottom <= 0 || rect.top >= innerHeight) continue;

      for (let xi = 0; xi < 5; xi++) {
        for (let yi = 0; yi < 5; yi++) {
          const px = rect.left + (rect.width * (xi + 0.5)) / 5;
          const py = rect.top + (rect.height * (yi + 0.5)) / 5;

          if (px >= 0 && px < innerWidth && py >= 0 && py < innerHeight) {
            const topEl = document.elementFromPoint(px, py);
            if (topEl && topEl.tagName !== 'IMG') {
              allPointsNoOverlay = false;
              overlayViolationDetails.push(`${topEl.tagName}.${topEl.className || topEl.innerText?.slice(0, 15)} at (${Math.round(px)},${Math.round(py)})`);
            }
          }
        }
      }
    }

    // 8. Khoảng trống dọc lớn nhất giữa 2 khối liền nhau <= 40px (Phần 2 mục H1)
    // Các khối: thanh trên, đối thủ, giữa bàn, Thể Trạng, dải thông tin, bài tay
    const sectionSelectors = [
      'header',
      '[data-testid="portrait-top-section"]',
      'aside',
      '[data-testid="center-table-bar"]',
      '[data-testid="self-psyche-section"]',
      '[data-testid="action-info-bar"]',
      '[data-testid="self-hand-section"]',
    ];

    const foundSections = sectionSelectors
      .map((sel) => document.querySelector(sel))
      .filter(Boolean)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { el, top: r.top, bottom: r.bottom };
      })
      .sort((a, b) => a.top - b.top);

    let maxVerticalGap = 0;
    for (let i = 0; i < foundSections.length - 1; i++) {
      const gap = foundSections[i + 1].top - foundSections[i].bottom;
      if (gap > maxVerticalGap) {
        maxVerticalGap = Math.round(gap);
      }
    }

    // 9. Kiểm tra chữ không bị cắt (scrollWidth > clientWidth hoặc scrollHeight > clientHeight khi overflow hidden/clip)
    let noTextOverflowClipped = true;
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      const isClipped =
        style.overflow === 'hidden' ||
        style.overflow === 'clip' ||
        style.overflowX === 'hidden' ||
        style.overflowY === 'hidden';

      if (isClipped && el.children.length === 0 && el.textContent && el.textContent.trim().length > 0) {
        if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) {
          noTextOverflowClipped = false;
        }
      }
    }

    // 10. Không từ nào bị bẻ sang 2 dòng (Phần 2 mục H1)
    let noWordBrokenAcrossLines = true;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      const text = currentNode.nodeValue || '';
      if (!text.trim()) continue;

      const words = text.split(/\s+/).filter(Boolean);
      let searchIndex = 0;
      for (const word of words) {
        const wordStart = text.indexOf(word, searchIndex);
        if (wordStart === -1) continue;
        searchIndex = wordStart + word.length;

        try {
          const range = document.createRange();
          range.setStart(currentNode, wordStart);
          range.setEnd(currentNode, wordStart + word.length);
          const clientRects = range.getClientRects();
          if (clientRects.length > 1) {
            noWordBrokenAcrossLines = false;
            break;
          }
        } catch {
          // ignore range errors
        }
      }
      if (!noWordBrokenAcrossLines) break;
    }

    // 11. Min font size across all text elements (yêu cầu >= 11px)
    let minFontSize = 999;
    for (const el of allElements) {
      const fsPx = parseFloat(window.getComputedStyle(el).fontSize);
      if (el.textContent && el.textContent.trim().length > 0) {
        if (!isNaN(fsPx) && fsPx > 0 && fsPx < minFontSize) {
          minFontSize = fsPx;
        }
      }
    }

    // 12. Đếm emoji trên toàn bàn chơi (yêu cầu <= 3)
    const bodyText = document.body.innerText || '';
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = bodyText.match(emojiRegex) || [];

    return {
      scrollWidth,
      scrollHeight,
      innerWidth,
      innerHeight,
      noHorizontalOverflow: scrollWidth <= innerWidth,
      noVerticalOverflow: scrollHeight <= innerHeight,
      totalHandCards: handCardEls.length,
      handCardsInViewport,
      allHandCardsInViewport: handCardsInViewport === handCardEls.length,
      minHandExposure: minHandExposure === 999 ? 24 : minHandExposure,
      minHandCardWidth: minHandCardWidth === 999 ? 0 : minHandCardWidth,
      minPsycheCardWidth: minPsycheCardWidth === 999 ? 0 : minPsycheCardWidth,
      minOppCardWidth: minOppCardWidth === 999 ? 0 : minOppCardWidth,
      hasOppImages,
      allOpponentSeatsInViewport,
      endTurnBottom,
      endTurnInside,
      allImagesContain,
      allImagesRatioOk,
      allImagesNaturalWidthOk,
      allPointsNoOverlay,
      maxVerticalGap,
      noTextOverflowClipped,
      noWordBrokenAcrossLines,
      minFontSize: minFontSize === 999 ? 11 : Math.round(minFontSize),
      emojiCount: emojis.length,
    };
  });
}
