export type SeatPosition = 'top' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom';
export type ScreenOrientation = 'portrait' | 'landscape';

export interface PlayerSeat {
  playerId: string;
  position: SeatPosition;
}

/**
 * Tính toán vị trí ghế ngồi quanh bàn chơi (sòng bài).
 *
 * Nguyên tắc:
 * - Mình luôn ở cạnh dưới ('bottom').
 * - Đối thủ xếp theo thứ tự lượt chơi tính từ người đi ngay sau mình, theo chiều kim đồng hồ:
 *   + 1 đối thủ  -> 'top'
 *   + 2 đối thủ  -> dọc: 'top-left', 'top-right'; ngang: 'left', 'right'
 *   + 3 đối thủ  -> 'left', 'top', 'right'
 * - Người xem (myId không thuộc playerIds): không crash, xếp mọi người quanh bàn.
 */
export function computeOpponentSeats(
  playerIds: string[],
  myId?: string | null,
  orientation: ScreenOrientation = 'portrait',
): PlayerSeat[] {
  if (!playerIds || playerIds.length === 0) {
    return [];
  }

  const myIndex = myId ? playerIds.indexOf(myId) : -1;

  // Trường hợp người xem (spectator): không tìm thấy myId trong danh sách người chơi
  if (myIndex === -1) {
    const total = playerIds.length;
    if (total === 1) {
      return [{ playerId: playerIds[0], position: 'top' }];
    }
    if (total === 2) {
      return [
        { playerId: playerIds[0], position: 'bottom' },
        { playerId: playerIds[1], position: 'top' },
      ];
    }
    if (total === 3) {
      if (orientation === 'portrait') {
        return [
          { playerId: playerIds[0], position: 'bottom' },
          { playerId: playerIds[1], position: 'top-left' },
          { playerId: playerIds[2], position: 'top-right' },
        ];
      }
      return [
        { playerId: playerIds[0], position: 'bottom' },
        { playerId: playerIds[1], position: 'left' },
        { playerId: playerIds[2], position: 'right' },
      ];
    }
    // 4 người chơi
    return [
      { playerId: playerIds[0], position: 'bottom' },
      { playerId: playerIds[1], position: 'left' },
      { playerId: playerIds[2], position: 'top' },
      { playerId: playerIds[3], position: 'right' },
    ];
  }

  // Trường hợp người chơi tham gia ván:
  // Lấy danh sách đối thủ theo chiều kim đồng hồ bắt đầu từ người đi ngay sau mình
  const n = playerIds.length;
  const opponentsInTurnOrder: string[] = [];
  for (let i = 1; i < n; i++) {
    const nextPlayerId = playerIds[(myIndex + i) % n];
    opponentsInTurnOrder.push(nextPlayerId);
  }

  const count = opponentsInTurnOrder.length;

  if (count === 1) {
    return [{ playerId: opponentsInTurnOrder[0], position: 'top' }];
  }

  if (count === 2) {
    if (orientation === 'portrait') {
      return [
        { playerId: opponentsInTurnOrder[0], position: 'top-left' },
        { playerId: opponentsInTurnOrder[1], position: 'top-right' },
      ];
    }
    return [
      { playerId: opponentsInTurnOrder[0], position: 'left' },
      { playerId: opponentsInTurnOrder[1], position: 'right' },
    ];
  }

  if (count === 3) {
    return [
      { playerId: opponentsInTurnOrder[0], position: 'left' },
      { playerId: opponentsInTurnOrder[1], position: 'top' },
      { playerId: opponentsInTurnOrder[2], position: 'right' },
    ];
  }

  // Dự phòng cho > 3 đối thủ (nếu mở rộng số lượng người chơi sau này)
  const defaultPositions: SeatPosition[] = ['left', 'top-left', 'top', 'top-right', 'right'];
  return opponentsInTurnOrder.map((pid, idx) => ({
    playerId: pid,
    position: defaultPositions[idx % defaultPositions.length],
  }));
}

/**
 * Trả về Map tra cứu nhanh vị trí theo playerId
 */
export function getSeatsMap(seats: PlayerSeat[]): Record<string, SeatPosition> {
  const map: Record<string, SeatPosition> = {};
  for (const s of seats) {
    map[s.playerId] = s.position;
  }
  return map;
}
