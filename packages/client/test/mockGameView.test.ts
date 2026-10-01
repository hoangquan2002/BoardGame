import { describe, it, expect } from 'vitest';
import { createMockGameData } from '../src/games/side-effects/mockGameView.js';
import cardsData from '../../games/side-effects/src/data/cards.json' with { type: 'json' };

describe('mockGameView Task R1 requirements', () => {
  it('chỉ dùng cardId có thật trong cards.json', () => {
    const validBaseIds = new Set<string>([
      ...cardsData.disorders.map((d: { id: string }) => d.id),
      ...cardsData.drugs.map((dr: { id: string }) => dr.id),
      'episode',
      'therapy',
    ]);

    for (const players of [2, 3, 4]) {
      for (const hand of [4, 8, 12]) {
        for (const turn of ['me', 'other']) {
          const params = new URLSearchParams({
            players: String(players),
            hand: String(hand),
            turn,
          });
          const { gameView } = createMockGameData(params);

          for (const player of gameView.players) {
            // Kiểm tra bài tay (chỉ có ở người xem)
            if (player.hand) {
              for (const c of player.hand) {
                const baseId = c.cardId.split('#')[0];
                expect(validBaseIds.has(baseId), `cardId "${c.cardId}" không có trong cards.json`).toBe(true);
              }
            }
            // Kiểm tra Thể Trạng
            for (const slot of player.psyche) {
              if (slot.disorder) {
                const baseId = slot.disorder.cardId.split('#')[0];
                expect(validBaseIds.has(baseId), `disorder "${slot.disorder.cardId}" không có trong cards.json`).toBe(true);
              }
              if (slot.drug) {
                const baseId = slot.drug.cardId.split('#')[0];
                expect(validBaseIds.has(baseId), `drug "${slot.drug.cardId}" không có trong cards.json`).toBe(true);
              }
            }
          }
        }
      }
    }
  });

  it('dữ liệu mẫu chứa đầy đủ các yêu cầu mục G', () => {
    const params = new URLSearchParams({ players: '4', hand: '8', turn: 'me' });
    const { roomState, gameView } = createMockGameData(params);

    // 1. Thuốc đã dùng trên Bệnh Lý của mình và của đối thủ
    const me = gameView.players.find((p) => p.id === 'user-me')!;
    const myCuredSlots = me.psyche.filter((s) => s.drug !== null);
    expect(myCuredSlots.length).toBeGreaterThan(0);

    const opponents = gameView.players.filter((p) => p.id !== 'user-me');
    const oppCuredSlots = opponents.flatMap((p) => p.psyche).filter((s) => s.drug !== null);
    expect(oppCuredSlots.length).toBeGreaterThan(0);

    // 2. 1 đối thủ mất kết nối, 1 đối thủ là máy
    const oppPlayers = roomState.players.filter((p) => p.playerId !== 'user-me');
    const disconnectedOpp = oppPlayers.find((p) => !p.connected);
    const botOpp = oppPlayers.find((p) => p.isBot);
    expect(disconnectedOpp).toBeDefined();
    expect(botOpp).toBeDefined();

    // 3. Bài tay có đủ 4 loại lá
    const cardTypes = new Set(me.hand.map((c) => c.type));
    expect(cardTypes.has('drug')).toBe(true);
    expect(cardTypes.has('disorder')).toBe(true);
    expect(cardTypes.has('episode')).toBe(true);
    expect(cardTypes.has('therapy')).toBe(true);

    // 4. Có tên Bệnh Lý dài nhất (suicidal-thoughts, gambling-addiction) và tên Thuốc dài nhất (chlorpromazine, pramipexole)
    const allDisorderIds = [
      ...me.hand.filter((c) => c.type === 'disorder').map((c) => c.cardId.split('#')[0]),
      ...gameView.players.flatMap((p) => p.psyche.map((s) => s.disorder?.cardId.split('#')[0])),
    ];
    const allDrugIds = [
      ...me.hand.filter((c) => c.type === 'drug').map((c) => c.cardId.split('#')[0]),
      ...gameView.players.flatMap((p) => p.psyche.map((s) => s.drug?.cardId.split('#')[0])),
    ];

    expect(allDisorderIds).toContain('suicidal-thoughts');
    expect(allDisorderIds).toContain('gambling-addiction');
    expect(allDrugIds).toContain('chlorpromazine');
    expect(allDrugIds).toContain('pramipexole');
  });
});
