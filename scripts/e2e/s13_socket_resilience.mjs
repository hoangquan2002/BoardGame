import { newPlayer } from './helpers.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const socketIoPath = path.resolve(__dirname, '../../packages/client/node_modules/socket.io-client/build/esm/index.js');

export async function runS13(browser, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const results = [];

  // 1. Kiểm tra Socket chịu lỗi: sự kiện sai định dạng, thiếu ack, sai quyền (design.md mục 8 & promt.md Phần 1 mục 10)
  try {
    const { io } = await import('file:///' + socketIoPath.replace(/\\/g, '/'));
    const socket = io(cleanBase, { transports: ['websocket', 'polling'], timeout: 5000 });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket connection timeout')), 6000);
      socket.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // (a) Gửi sự kiện không kèm ack
    socket.emit('room:create');
    socket.emit('room:create', { name: 'Bad', gameId: 'side-effects' });
    socket.emit('room:join');
    socket.emit('room:join', { roomCode: 'ABCDE', name: 'Bad' });
    socket.emit('room:resume');
    socket.emit('room:start');
    socket.emit('game:action');
    socket.emit('room:leave');

    // (b) Gửi payload undefined
    socket.emit('room:create', undefined, () => {});
    socket.emit('room:join', undefined, () => {});
    socket.emit('room:resume', undefined, () => {});
    socket.emit('room:start', undefined, () => {});
    socket.emit('game:action', undefined, () => {});

    // (c) Gửi payload sai kiểu (chuỗi, mảng, số, null, object rác)
    socket.emit('room:create', 'not-an-object', () => {});
    socket.emit('room:create', { name: 1234, gameId: null }, () => {});
    socket.emit('room:join', [1, 2, 3], () => {});
    socket.emit('room:join', { roomCode: 999, name: {} }, () => {});
    socket.emit('room:resume', 456, () => {});
    socket.emit('game:action', 'bad-action', () => {});
    socket.emit('game:action', { action: null }, () => {});
    socket.emit('game:action', { action: { type: 1234 } }, () => {});

    // (d) Gửi sự kiện sai quyền (chưa vào phòng mà gửi action)
    let unauthorizedError = null;
    socket.emit('game:action', { action: { type: 'END_TURN' } }, (res) => {
      if (res && !res.ok) {
        unauthorizedError = res.error;
      }
    });

    // Đợi server xử lý
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Kiểm tra /healthz server vẫn 200 OK
    const healthRes = await fetch(`${cleanBase}/healthz`);
    const healthOk = healthRes.status === 200;

    socket.disconnect();

    results.push({
      name: 'Server chịu lỗi socket: gửi sai định dạng, thiếu ack, sai quyền server không sập',
      passed: healthOk,
      detail: `/healthz=${healthRes.status}, unauthorizedError="${unauthorizedError}"`,
    });
  } catch (err) {
    results.push({
      name: 'Server chịu lỗi socket: gửi sai định dạng, thiếu ack, sai quyền',
      passed: false,
      detail: err.message,
    });
  }

  // 2. Kiểm tra F5 / Tải lại trang: khôi phục phiên
  const { context, page } = await newPlayer(browser, { width: 375, height: 667 });
  try {
    await page.goto(cleanBase, { waitUntil: 'networkidle', timeout: 15000 });

    // Tạo phòng
    const nameInput = page.locator('input[placeholder*="tên" i], input[type="text"]').first();
    await nameInput.fill('Người chơi S13');
    const createBtn = page.locator('button:has-text("Tạo phòng mới")');
    await createBtn.click();
    await page.waitForSelector('[data-testid="invite-url-input"]', { timeout: 8000 });

    const inviteUrl = await page.evaluate(() => {
      const input = document.querySelector('[data-testid="invite-url-input"]') || document.querySelector('input[readonly]');
      return input ? input.value : '';
    });
    const codeMatch = inviteUrl.match(/room=([A-Z0-9]+)/i);
    const roomCode = codeMatch ? codeMatch[1] : '';

    // Tải lại trang (F5) khi đang ở trong phòng: khôi phục phiên
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const stillInLobby = await page.locator('[data-testid="invite-url-input"]').isVisible();
    const resumeDialog = await page.locator('text=Tìm thấy phiên chơi trước đó').isVisible();
    const restoreOk = stillInLobby || resumeDialog;

    results.push({
      name: 'Tải lại trang (F5): tự động kết nối lại hoặc khôi phục phiên',
      passed: restoreOk && Boolean(roomCode),
      detail: `roomCode="${roomCode}", stillInLobby=${stillInLobby}, resumeDialog=${resumeDialog}`,
    });
  } catch (err) {
    results.push({ name: 'Lỗi kiểm thử khôi phục phiên F5', passed: false, detail: err.message });
  } finally {
    await context.close();
  }

  const allPassed = results.every((r) => r.passed);
  return { id: 'S13', name: 'Kiểm tra socket chịu lỗi & khôi phục phiên', passed: allPassed, items: results };
}
