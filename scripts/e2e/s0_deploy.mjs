export async function runS0(baseUrl) {
  const results = [];
  const cleanBase = baseUrl.replace(/\/+$/, '');

  // 1. /healthz
  try {
    const res = await fetch(`${cleanBase}/healthz`);
    const text = await res.text();
    const ok = res.status === 200 && text.trim() === 'OK';
    results.push({ name: 'GET /healthz', passed: ok, detail: `status=${res.status}, body="${text.trim()}"` });
  } catch (err) {
    results.push({ name: 'GET /healthz', passed: false, detail: err.message });
  }

  // 2. /version
  try {
    const res = await fetch(`${cleanBase}/version`);
    const json = await res.json();
    const ok = res.status === 200 && typeof json.commit === 'string';
    results.push({ name: 'GET /version', passed: ok, detail: `status=${res.status}, commit="${json.commit}"` });
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
