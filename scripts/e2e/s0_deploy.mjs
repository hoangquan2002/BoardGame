import { execSync } from 'node:child_process';

export async function runS0(baseUrl) {
  const results = [];
  const cleanBase = baseUrl.replace(/\/+$/, '');

  // Lấy commit HEAD hiện tại qua git (nếu có)
  let localHead = '';
  try {
    localHead = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    // ignore
  }

  // 1. /healthz
  try {
    const res = await fetch(`${cleanBase}/healthz`);
    const text = await res.text();
    const ok = res.status === 200 && text.trim() === 'OK';
    results.push({ name: 'GET /healthz', passed: ok, detail: `status=${res.status}, body="${text.trim()}"` });
  } catch (err) {
    results.push({ name: 'GET /healthz', passed: false, detail: err.message });
  }

  // 2. /version - So sánh với git rev-parse HEAD
  try {
    const res = await fetch(`${cleanBase}/version`);
    const json = await res.json();
    const isLocal = cleanBase.includes('localhost') || cleanBase.includes('127.0.0.1');

    let commitOk = false;
    let detailMsg = '';
    if (isLocal) {
      commitOk = res.status === 200 && (json.commit === 'dev' || (localHead && localHead.startsWith(json.commit)));
      detailMsg = `local: commit="${json.commit}" (hợp lệ khi dev hoặc match HEAD)`;
    } else {
      // Trên URL thật (Render): phải khớp đúng commit git HEAD
      commitOk = res.status === 200 && typeof json.commit === 'string' && Boolean(localHead) && localHead.startsWith(json.commit);
      detailMsg = `render: commit="${json.commit}", gitHead="${localHead ? localHead.slice(0, 7) : 'unknown'}"`;
    }

    results.push({
      name: 'GET /version khớp git rev-parse HEAD',
      passed: commitOk,
      detail: detailMsg,
    });
  } catch (err) {
    results.push({ name: 'GET /version', passed: false, detail: err.message });
  }

  // 3. /robots.txt
  try {
    const res = await fetch(`${cleanBase}/robots.txt`);
    const text = await res.text();
    const ok = res.status === 200 && text.includes('Disallow: /');
    results.push({ name: 'GET /robots.txt', passed: ok, detail: `status=${res.status}, hasDisallow=${text.includes('Disallow: /')}` });
  } catch (err) {
    results.push({ name: 'GET /robots.txt', passed: false, detail: err.message });
  }

  // 4. /.env (chặn dotfiles)
  try {
    const res = await fetch(`${cleanBase}/.env`);
    const ok = res.status === 403 || res.status === 404;
    results.push({ name: 'Chặn /.env', passed: ok, detail: `status=${res.status} (yêu cầu 403 hoặc 404)` });
  } catch (err) {
    results.push({ name: 'Chặn /.env', passed: false, detail: err.message });
  }

  // 5. /../package.json (chặn path traversal)
  try {
    const res = await fetch(`${cleanBase}/../package.json`);
    const ok = res.status === 403 || res.status === 404;
    results.push({ name: 'Chặn /../package.json', passed: ok, detail: `status=${res.status} (yêu cầu 403 hoặc 404)` });
  } catch (err) {
    results.push({ name: 'Chặn /../package.json', passed: false, detail: err.message });
  }

  // 6. File PDF (chặn tải PDF trực tiếp)
  try {
    const res = await fetch(`${cleanBase}/Side%20effects.pdf`);
    const ok = res.status === 403 || res.status === 404;
    results.push({ name: 'Chặn /Side effects.pdf', passed: ok, detail: `status=${res.status} (yêu cầu 403 hoặc 404)` });
  } catch (err) {
    results.push({ name: 'Chặn /Side effects.pdf', passed: false, detail: err.message });
  }

  const allPassed = results.every((r) => r.passed);
  return { id: 'S0', name: 'Kiểm tra triển khai & bảo mật endpoint', passed: allPassed, items: results };
}
