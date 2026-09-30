import { createRng } from '@boardgame/core';
import { describe, expect, it } from 'vitest';
import { sideEffectsGame } from '../src/game.js';
import { setupSideEffects } from '../src/setup.js';
import type { SEState } from '../src/types.js';

describe('Side Effects PlayerView (Bảo mật thông tin ẩn) Tests (Task T2)', () => {
  it('JSON của view người A không chứa instanceId nào trên tay người khác hay thứ tự chồng rút', () => {
    const rng = createRng('test-player-view-secrecy');
    const state = setupSideEffects(['A', 'B', 'C'], {}, rng);

    const playerB = state.players.find((p) => p.id === 'B')!;
    const playerC = state.players.find((p) => p.id === 'C')!;

    // Gán ID đặc trưng cho bài của B và C
    playerB.hand[0] = {
      instanceId: 'secret-card-b-999',
      cardId: 'episode',
      type: 'episode',
    };
    playerC.hand[0] = {
      instanceId: 'secret-card-c-888',
      cardId: 'therapy',
      type: 'therapy',
    };

    // Gán ID đặc trưng cho lá bài trong drawPile
    state.drawPile[0] = {
      instanceId: 'secret-draw-pile-top-777',
      cardId: 'fluoxetine',
      type: 'drug',
    };

    const viewA = sideEffectsGame.playerView(state, 'A');
    const viewAJson = JSON.stringify(viewA);

    // Không lộ bài trên tay B và C
    expect(viewAJson.includes('secret-card-b-999')).toBe(false);
    expect(viewAJson.includes('secret-card-c-888')).toBe(false);

    // Không lộ lá bài trong drawPile
    expect(viewAJson.includes('secret-draw-pile-top-777')).toBe(false);
    expect((viewA as unknown as SEState).drawPile).toBeUndefined();
    expect(viewA.drawPileCount).toBe(state.drawPile.length);

    // Chỉ có bài của chính A
    const aInView = viewA.players.find((p) => p.id === 'A')!;
    expect(aInView.hand).toBeDefined();
    expect(aInView.handCount).toBe(state.players.find((p) => p.id === 'A')!.hand.length);

    const bInView = viewA.players.find((p) => p.id === 'B')!;
    expect(bInView.hand).toBeUndefined();
    expect(bInView.handCount).toBe(state.players.find((p) => p.id === 'B')!.hand.length);
  });

  it('ngoại lệ Lo âu: CHỈ kẻ gây hại thấy tay nạn nhân qua revealedHand', () => {
    const rng = createRng('test-anxiety-reveal');
    const state = setupSideEffects(['A', 'B', 'C'], {}, rng);
    const attackerA = state.players.find((p) => p.id === 'A')!;
    const victimB = state.players.find((p) => p.id === 'B')!;

    victimB.psyche[0]!.disorder.cardId = 'anxiety';
    victimB.psyche[0]!.drug = null;
    victimB.hand = [
      { instanceId: 'victim-revealed-card-1', cardId: 'episode', type: 'episode' },
    ];
    attackerA.hand = [
      { instanceId: 'ep-reveal', cardId: 'episode', type: 'episode' },
    ];

    // A đánh Triệu Chứng vào Lo âu của B
    const s1 = sideEffectsGame.apply(
      state,
      'A',
      {
        type: 'EPISODE',
        episodeId: 'ep-reveal',
        targetPlayerId: 'B',
        disorderId: victimB.psyche[0]!.disorder.instanceId,
      },
      rng,
    );

    // 1. Kẻ gây hại A xem: CÓ revealedHand của B
    const viewA = sideEffectsGame.playerView(s1, 'A');
    const bInViewA = viewA.players.find((p) => p.id === 'B')!;
    expect(bInViewA.revealedHand).toBeDefined();
    expect(bInViewA.revealedHand).toHaveLength(1);
    expect(bInViewA.revealedHand![0]!.instanceId).toBe('victim-revealed-card-1');

    // 2. Nạn nhân B xem: KHÔNG có revealedHand của chính mình (chỉ có hand của chính mình)
    const viewB = sideEffectsGame.playerView(s1, 'B');
    const bInViewB = viewB.players.find((p) => p.id === 'B')!;
    expect(bInViewB.revealedHand).toBeUndefined();

    // 3. Người ngoài C xem: TUYỆT ĐỐI KHÔNG thấy revealedHand của B!
    const viewC = sideEffectsGame.playerView(s1, 'C');
    const bInViewC = viewC.players.find((p) => p.id === 'B')!;
    expect(bInViewC.revealedHand).toBeUndefined();
    expect(JSON.stringify(viewC).includes('victim-revealed-card-1')).toBe(false);
  });

  it('giao dịch: chỉ 2 bên tham gia mới thấy lá đưa ra, người ngoài chỉ thấy số lượng', () => {
    const rng = createRng('test-trade-view-secrecy');
    const state = setupSideEffects(['A', 'B', 'C'], {}, rng);
    const pA = state.players.find((p) => p.id === 'A')!;
    pA.hand = [{ instanceId: 'trade-secret-a', cardId: 'episode', type: 'episode' }];

    const s1 = sideEffectsGame.apply(
      state,
      'A',
      {
        type: 'PROPOSE_TRADE',
        targetPlayerId: 'B',
        offerCardIds: ['trade-secret-a'],
      },
      rng,
    );

    // A thấy lá đưa ra
    const viewA = sideEffectsGame.playerView(s1, 'A');
    expect(viewA.trades[0]!.offerCardIds).toEqual(['trade-secret-a']);

    // B thấy lá đưa ra
    const viewB = sideEffectsGame.playerView(s1, 'B');
    expect(viewB.trades[0]!.offerCardIds).toEqual(['trade-secret-a']);

    // C là người ngoài: KHÔNG thấy lá đưa ra, chỉ thấy số lượng
    const viewC = sideEffectsGame.playerView(s1, 'C');
    expect(viewC.trades[0]!.offerCardIds).toBeUndefined();
    expect(viewC.trades[0]!.offerCardCount).toBe(1);
    expect(JSON.stringify(viewC).includes('trade-secret-a')).toBe(false);
  });
});
