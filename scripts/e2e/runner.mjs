#!/usr/bin/env node
import { launchBrowser } from './helpers.mjs';
import { runS0 } from './s0_deploy.mjs';
import { runS1 } from './s1_lobby.mjs';
import { runS2 } from './s2_mock_layout.mjs';

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
  console.log(`Kịch bản: ${only ? only.join(', ') : 'TẤT CẢ (S0, S1, S2)'}`);
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
    if (!only || only.includes('S1') || only.includes('S2')) {
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

    // S2: Mock Layout
    if (!only || only.includes('S2')) {
      console.log(`\n▶ Đang chạy kịch bản S2: Kiểm tra bố cục bản phác /?mock=1...`);
      const s2Res = await runS2(browser, url);
      results.push(s2Res);
      s2TableRows = s2Res.tableRows || [];
      console.log(`  S2: ${s2Res.passed ? '✅ ĐẠT' : '❌ THẤT BẠI'}`);
      for (const it of s2Res.items) {
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
    console.log(`\n### Bảng số đo thực tế bố cục /?mock=1 (Kịch bản S2)\n`);
    console.log(`| Kích thước | Người | Bài tay | \`scrollWidth\` | \`scrollHeight\` | Bài tay trọn màn hình | Nút KT lượt (bottom) | Font min | Kết quả |`);
    console.log(`|---|---|---|---|---|---|---|---|---|`);
    for (const row of s2TableRows) {
      console.log(`| **${row.viewport}** | ${row.players} | ${row.hand} lá | ${row.scrollW} | ${row.scrollH} | ${row.handStatus} | ${row.endTurnBottom} | ${row.minFont} | **${row.passed}** |`);
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
