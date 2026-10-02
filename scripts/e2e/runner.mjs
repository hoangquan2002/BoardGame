#!/usr/bin/env node
import { launchBrowser } from './helpers.mjs';
import { runS0 } from './s0_deploy.mjs';
import { runS1 } from './s1_lobby.mjs';
import { runS2 } from './s2_mock_layout.mjs';
import { runS3 } from './s3_card_content.mjs';
import { runS4 } from './s4_touch_zoom.mjs';
import { runS5 } from './s5_real_gameplay.mjs';
import { runS8 } from './s8_rotate.mjs';
import { runS13 } from './s13_socket_resilience.mjs';
import { runS15 } from './s15_rules.mjs';
import { runS16 } from './s16_discard_turn.mjs';
import { runS17 } from './s17_trade.mjs';

function parseArgs() {
  const args = process.argv.slice(2);
  let url = 'http://localhost:3000';
  let only = null;
  let headed = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      url = args[i + 1];
      i++;
    } else if (args[i] === '--only' && args[i + 1]) {
      only = args[i + 1].split(',').map((s) => s.trim().toUpperCase());
      i++;
    } else if (args[i] === '--headed') {
      headed = true;
    }
  }

  return { url, only, headed };
}

async function main() {
  const { url, only, headed } = parseArgs();
  console.log(`\n========================================`);
  console.log(`BẮT ĐẦU CHẠY E2E TESTS TRÊN: ${url}`);
  console.log(`Kịch bản: ${only ? only.join(', ') : 'TẤT CẢ (S0, S1, S2, S3, S4, S5, S8, S13, S15, S16, S17)'}`);
  console.log(`Chế độ: ${headed ? 'Headed' : 'Headless'}`);
  console.log(`========================================\n`);

  const results = [];
  let s2TableRows = [];

  // S0: Deploy & Security
  if (!only || only.includes('S0')) {
    console.log(`▶ Đang chạy kịch bản S0: Kiểm tra deploy & security...`);
    const s0Res = await runS0(url);
    results.push(s0Res);
    console.log(`  S0: ${s0Res.passed ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
    for (const it of s0Res.items) {
      console.log(`    - ${it.passed ? '✓' : '✗'} ${it.name}: ${it.detail}`);
    }
  }

  let browser = null;
  try {
    const needsBrowser = !only || only.some((k) => ['S1', 'S2', 'S3', 'S4', 'S5', 'S8', 'S13', 'S15', 'S16', 'S17'].includes(k));
    if (needsBrowser) {
      browser = await launchBrowser({ headed });
    }

    // S1: Lobby
    if (!only || only.includes('S1')) {
      console.log(`\n▶ Đang chạy kịch bản S1: Kiểm tra trang chủ & phòng chờ...`);
      const s1Res = await runS1(browser, url);
      results.push(s1Res);
      console.log(`  S1: ${s1Res.passed ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
      for (const it of s1Res.items) {
        console.log(`    - ${it.passed ? '✓' : '✗'} ${it.name}: ${it.detail}`);
      }
    }

    // S2: Layout
    if (!only || only.includes('S2')) {
      console.log(`\n▶ Đang chạy kịch bản S2: Kiểm tra bố cục bàn chơi /?mock=1 (5 màn hình & phòng thật)...`);
      const s2Res = await runS2(browser, url);
      results.push(s2Res);
      s2TableRows = s2Res.tableRows || [];
      console.log(`  S2: ${s2Res.passed ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
      for (const it of s2Res.items) {
        console.log(`    - ${it.passed ? '✓' : '✗'} ${it.name}: ${it.detail}`);
      }
    }

    // S3: Card Content & No WebP
    if (!only || only.includes('S3')) {
      console.log(`\n▶ Đang chạy kịch bản S3: Kiểm tra ảnh bài sắc nét & dữ liệu tiếng Việt...`);
      const s3Res = await runS3(browser, url);
      results.push(s3Res);
      console.log(`  S3: ${s3Res.passed ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
      for (const it of s3Res.items) {
        console.log(`    - ${it.passed ? '✓' : '✗'} ${it.name}: ${it.detail}`);
      }
    }

    // S4: CDP Touch Zoom
    if (!only || only.includes('S4')) {
      console.log(`\n▶ Đang chạy kịch bản S4: Kiểm tra nhấn giữ cảm ứng thật (CDP Touch)...`);
      const s4Res = await runS4(browser, url);
      results.push(s4Res);
      console.log(`  S4: ${s4Res.passed ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
      for (const it of s4Res.items) {
        console.log(`    - ${it.passed ? '✓' : '✗'} ${it.name}: ${it.detail}`);
      }
    }

    // S5: Real Gameplay (2 players + 2 bots)
    if (!only || only.includes('S5')) {
      console.log(`\n▶ Đang chạy kịch bản S5: Kiểm tra ván thật 2 người thật + 2 máy...`);
      const s5Res = await runS5(browser, url);
      results.push(s5Res);
      console.log(`  S5: ${s5Res.passed ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
      for (const it of s5Res.items) {
        console.log(`    - ${it.passed ? '✓' : '✗'} ${it.name}: ${it.detail}`);
      }
    }

    // S8: Screen Rotation
    if (!only || only.includes('S8')) {
      console.log(`\n▶ Đang chạy kịch bản S8: Kiểm tra xoay ngang/dọc giữa ván...`);
      const s8Res = await runS8(browser, url);
      results.push(s8Res);
      console.log(`  S8: ${s8Res.passed ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
      for (const it of s8Res.items) {
        console.log(`    - ${it.passed ? '✓' : '✗'} ${it.name}: ${it.detail}`);
      }
    }

    // S13: Socket Resilience
    if (!only || only.includes('S13')) {
      console.log(`\n▶ Đang chạy kịch bản S13: Kiểm tra socket chịu lỗi & khôi phục phiên...`);
      const s13Res = await runS13(browser, url);
      results.push(s13Res);
      console.log(`  S13: ${s13Res.passed ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
      for (const it of s13Res.items) {
        console.log(`    - ${it.passed ? '✓' : '✗'} ${it.name}: ${it.detail}`);
      }
    }

    // S15: Rules Sheet (Task R2)
    if (!only || only.includes('S15')) {
      console.log(`\n▶ Đang chạy kịch bản S15: Kiểm tra nút và tấm phủ Luật chơi (Task R2)...`);
      const s15Res = await runS15(browser, url);
      s15Res.id = 'S15';
      results.push(s15Res);
      console.log(`  S15: ${s15Res.passed ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
      for (const it of s15Res.items) {
        console.log(`    - ${it.passed ? '✓' : '✗'} ${it.name}: ${it.detail}`);
      }
    }

    // S16: Discard Turn (> 6 cards)
    if (!only || only.includes('S16')) {
      console.log(`\n▶ Đang chạy kịch bản S16: Kiểm tra Kết thúc lượt khi bài tay > 6 lá & DiscardModal...`);
      const s16Res = await runS16(browser, url);
      results.push(s16Res);
      console.log(`  S16: ${s16Res.passed ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
      for (const it of s16Res.items) {
        console.log(`    - ${it.passed ? '✓' : '✗'} ${it.name}: ${it.detail}`);
      }
    }

    // S17: Trade Between 2 Real Players
    if (!only || only.includes('S17')) {
      console.log(`\n▶ Đang chạy kịch bản S17: Kiểm tra đổi bài giữa 2 người thật & trade-notice...`);
      const s17Res = await runS17(browser, url);
      results.push(s17Res);
      console.log(`  S17: ${s17Res.passed ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
      for (const it of s17Res.items) {
        console.log(`    - ${it.passed ? '✓' : '✗'} ${it.name}: ${it.detail}`);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // In bảng tổng kết Markdown
  console.log(`\n========================================`);
  console.log(`BẢNG TỔNG KẾT KẾT QUẢ KIỂM THỬ (MARKDOWN)`);
  console.log(`========================================\n`);

  console.log(`### Kết quả tổng quan từng kịch bản\n`);
  console.log(`| Kịch bản | Tên kịch bản | Kết quả | Ghi chú |`);
  console.log(`|---|---|---|---|`);
  for (const r of results) {
    const passedCount = r.items.filter((it) => it.passed).length;
    console.log(`| **${r.id}** | ${r.name} | **${r.passed ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'}** | Đạt ${passedCount}/${r.items.length} tiêu chí |`);
  }

  if (s2TableRows.length > 0) {
    console.log(`\n### Bảng số đo thực tế bố cục bàn chơi (Kịch bản S2)\n`);
    console.log(`| Màn hình | Người | Bài tay | \`scrollWidth\` | \`scrollHeight\` | Bài tay trọn màn hình | Thể Trạng | Đối thủ | Khoảng trống max | Không đè ảnh | Kết quả |`);
    console.log(`|---|---|---|---|---|---|---|---|---|---|---|`);
    for (const row of s2TableRows) {
      console.log(`| **${row.viewport}** | ${row.players} | ${row.hand} lá | ${row.scrollW} | ${row.scrollH} | ${row.handStatus} | ${row.psycheStatus} | ${row.oppStatus} | ${row.maxGap} | ${row.noOverlay} | **${row.passed}** |`);
    }
  }

  const allPassed = results.every((r) => r.passed);
  console.log(`\nTổng kết: ${allPassed ? 'TẤT CẢ KỊCH BẢN ĐẠT 100%' : 'CÓ KỊCH BẢN KHÔNG ĐẠT'}`);
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});
