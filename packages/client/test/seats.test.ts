import { describe, expect, it } from 'vitest';
import { computeOpponentSeats, getSeatsMap } from '../src/games/side-effects/seats.js';

describe('Hàm xếp ghế sòng bài (seats.ts - Task T4b)', () => {
  describe('Ván 2 người chơi (A, B)', () => {
    const players = ['A', 'B'];

    it('Mình là A (portrait): đối thủ B ở trên', () => {
      const seats = computeOpponentSeats(players, 'A', 'portrait');
      expect(seats).toEqual([{ playerId: 'B', position: 'top' }]);
    });

    it('Mình là A (landscape): đối thủ B ở trên', () => {
      const seats = computeOpponentSeats(players, 'A', 'landscape');
      expect(seats).toEqual([{ playerId: 'B', position: 'top' }]);
    });

    it('Mình là B (portrait & landscape): đối thủ A ở trên', () => {
      expect(computeOpponentSeats(players, 'B', 'portrait')).toEqual([{ playerId: 'A', position: 'top' }]);
      expect(computeOpponentSeats(players, 'B', 'landscape')).toEqual([{ playerId: 'A', position: 'top' }]);
    });
  });

  describe('Ván 3 người chơi (A, B, C)', () => {
    const players = ['A', 'B', 'C'];

    it('Mình là A (vị trí đầu): B đi sau -> trái/trên-trái, C đi sau B -> phải/trên-phải', () => {
      // Dọc: trên-trái, trên-phải
      expect(computeOpponentSeats(players, 'A', 'portrait')).toEqual([
        { playerId: 'B', position: 'top-left' },
        { playerId: 'C', position: 'top-right' },
      ]);
      // Ngang: trái, phải
      expect(computeOpponentSeats(players, 'A', 'landscape')).toEqual([
        { playerId: 'B', position: 'left' },
        { playerId: 'C', position: 'right' },
      ]);
    });

    it('Mình là B (vị trí giữa): C đi sau B -> trái, A đi sau C -> phải', () => {
      expect(computeOpponentSeats(players, 'B', 'portrait')).toEqual([
        { playerId: 'C', position: 'top-left' },
        { playerId: 'A', position: 'top-right' },
      ]);
      expect(computeOpponentSeats(players, 'B', 'landscape')).toEqual([
        { playerId: 'C', position: 'left' },
        { playerId: 'A', position: 'right' },
      ]);
    });

    it('Mình là C (vị trí cuối): A đi sau C -> trái, B đi sau A -> phải', () => {
      expect(computeOpponentSeats(players, 'C', 'portrait')).toEqual([
        { playerId: 'A', position: 'top-left' },
        { playerId: 'B', position: 'top-right' },
      ]);
      expect(computeOpponentSeats(players, 'C', 'landscape')).toEqual([
        { playerId: 'A', position: 'left' },
        { playerId: 'B', position: 'right' },
      ]);
    });
  });

  describe('Ván 4 người chơi (A, B, C, D)', () => {
    const players = ['A', 'B', 'C', 'D'];

    it('Mình là A: B (sau A) -> trái, C (sau B) -> trên, D (sau C) -> phải (cả dọc & ngang)', () => {
      const expected = [
        { playerId: 'B', position: 'left' },
        { playerId: 'C', position: 'top' },
        { playerId: 'D', position: 'right' },
      ];
      expect(computeOpponentSeats(players, 'A', 'portrait')).toEqual(expected);
      expect(computeOpponentSeats(players, 'A', 'landscape')).toEqual(expected);
    });

    it('Mình là B: C -> trái, D -> trên, A -> phải', () => {
      const expected = [
        { playerId: 'C', position: 'left' },
        { playerId: 'D', position: 'top' },
        { playerId: 'A', position: 'right' },
      ];
      expect(computeOpponentSeats(players, 'B', 'portrait')).toEqual(expected);
      expect(computeOpponentSeats(players, 'B', 'landscape')).toEqual(expected);
    });

    it('Mình là C: D -> trái, A -> trên, B -> phải', () => {
      const expected = [
        { playerId: 'D', position: 'left' },
        { playerId: 'A', position: 'top' },
        { playerId: 'B', position: 'right' },
      ];
      expect(computeOpponentSeats(players, 'C', 'portrait')).toEqual(expected);
      expect(computeOpponentSeats(players, 'C', 'landscape')).toEqual(expected);
    });

    it('Mình là D: A -> trái, B -> trên, C -> phải', () => {
      const expected = [
        { playerId: 'A', position: 'left' },
        { playerId: 'B', position: 'top' },
        { playerId: 'C', position: 'right' },
      ];
      expect(computeOpponentSeats(players, 'D', 'portrait')).toEqual(expected);
      expect(computeOpponentSeats(players, 'D', 'landscape')).toEqual(expected);
    });
  });

  describe('Trường hợp người xem (spectator) hoặc myId không thuộc playerIds', () => {
    it('Mảng người chơi rỗng -> trả về [] an toàn', () => {
      expect(computeOpponentSeats([], 'viewer', 'portrait')).toEqual([]);
      expect(computeOpponentSeats([], null, 'landscape')).toEqual([]);
    });

    it('1 người chơi -> ở trên', () => {
      expect(computeOpponentSeats(['A'], 'spectator', 'portrait')).toEqual([
        { playerId: 'A', position: 'top' },
      ]);
    });

    it('2 người chơi -> A dưới, B trên', () => {
      expect(computeOpponentSeats(['A', 'B'], 'spectator', 'portrait')).toEqual([
        { playerId: 'A', position: 'bottom' },
        { playerId: 'B', position: 'top' },
      ]);
    });

    it('3 người chơi -> A dưới, B/C quanh bàn', () => {
      expect(computeOpponentSeats(['A', 'B', 'C'], 'spectator', 'portrait')).toEqual([
        { playerId: 'A', position: 'bottom' },
        { playerId: 'B', position: 'top-left' },
        { playerId: 'C', position: 'top-right' },
      ]);
      expect(computeOpponentSeats(['A', 'B', 'C'], 'spectator', 'landscape')).toEqual([
        { playerId: 'A', position: 'bottom' },
        { playerId: 'B', position: 'left' },
        { playerId: 'C', position: 'right' },
      ]);
    });

    it('4 người chơi -> A dưới, B trái, C trên, D phải', () => {
      expect(computeOpponentSeats(['A', 'B', 'C', 'D'], 'spectator', 'portrait')).toEqual([
        { playerId: 'A', position: 'bottom' },
        { playerId: 'B', position: 'left' },
        { playerId: 'C', position: 'top' },
        { playerId: 'D', position: 'right' },
      ]);
    });
  });

  describe('Hàm helper getSeatsMap', () => {
    it('Chuyển mảng ghế thành Map tra cứu theo playerId', () => {
      const seats = [
        { playerId: 'B', position: 'left' as const },
        { playerId: 'C', position: 'top' as const },
        { playerId: 'D', position: 'right' as const },
      ];
      const map = getSeatsMap(seats);
      expect(map).toEqual({
        B: 'left',
        C: 'top',
        D: 'right',
      });
    });
  });
});
