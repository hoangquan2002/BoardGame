import { createRng } from '@boardgame/core';
import { describe, expect, it } from 'vitest';
import { sideEffectsGame } from '../src/game.js';
import { setupSideEffects } from '../src/setup.js';
import type { SEAction } from '../src/types.js';

describe('Side Effects Trade (Thương Lượng) Tests (Task T2)', () => {
  it('đổi thành công: Proposer đề xuất, Target phản hồi, Proposer xác nhận', () => {
    const rng = createRng('test-trade-success');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const playerA = state.players.find((p) => p.id === 'A')!;
    const playerB = state.players.find((p) => p.id === 'B')!;

    // Thiết lập bài cụ thể
    playerA.hand = [
      { instanceId: 'card-a-1', cardId: 'episode', type: 'episode' },
      { instanceId: 'card-a-2', cardId: 'therapy', type: 'therapy' },
    ];
    playerB.hand = [
      { instanceId: 'card-b-1', cardId: 'chlorpromazine', type: 'drug' },
      { instanceId: 'card-b-2', cardId: 'lithium', type: 'drug' },
    ];

    // 1. A đề xuất đổi 'card-a-1' lấy bài của B
    const proposeAction: SEAction = {
      type: 'PROPOSE_TRADE',
      targetPlayerId: 'B',
      offerCardIds: ['card-a-1'],
    };
    expect(sideEffectsGame.validate(state, 'A', proposeAction)).toBeNull();
    const s1 = sideEffectsGame.apply(state, 'A', proposeAction, rng);
    expect(s1.trades).toHaveLength(1);
    const tradeId = s1.trades[0]!.tradeId;

    // 2. B đồng ý và đưa ra 'card-b-1'
    const respondAction: SEAction = {
      type: 'RESPOND_TRADE',
      tradeId,
      accept: true,
      giveCardIds: ['card-b-1'],
    };
    expect(sideEffectsGame.validate(s1, 'B', respondAction)).toBeNull();
    const s2 = sideEffectsGame.apply(s1, 'B', respondAction, rng);
    expect(s2.trades[0]!.status).toBe('RESPONDED');

    // 3. A xác nhận giao dịch
    const confirmAction: SEAction = {
      type: 'CONFIRM_TRADE',
      tradeId,
      accept: true,
    };
    expect(sideEffectsGame.validate(s2, 'A', confirmAction)).toBeNull();
    const s3 = sideEffectsGame.apply(s2, 'A', confirmAction, rng);

    // Giao dịch hoàn tất và đóng
    expect(s3.trades).toHaveLength(0);

    const aAfter = s3.players.find((p) => p.id === 'A')!;
    const bAfter = s3.players.find((p) => p.id === 'B')!;

    // A nhận được 'card-b-1', mất 'card-a-1'
    expect(aAfter.hand.some((c) => c.instanceId === 'card-b-1')).toBe(true);
    expect(aAfter.hand.some((c) => c.instanceId === 'card-a-1')).toBe(false);

    // B nhận được 'card-a-1', mất 'card-b-1'
    expect(bAfter.hand.some((c) => c.instanceId === 'card-a-1')).toBe(true);
    expect(bAfter.hand.some((c) => c.instanceId === 'card-b-1')).toBe(false);
  });

  it('bị từ chối: B từ chối lời đề nghị', () => {
    const rng = createRng('test-trade-reject');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const playerA = state.players.find((p) => p.id === 'A')!;
    playerA.hand = [{ instanceId: 'card-a', cardId: 'episode', type: 'episode' }];

    const s1 = sideEffectsGame.apply(
      state,
      'A',
      {
        type: 'PROPOSE_TRADE',
        targetPlayerId: 'B',
        offerCardIds: ['card-a'],
      },
      rng,
    );
    const tradeId = s1.trades[0]!.tradeId;

    const sRejected = sideEffectsGame.apply(
      s1,
      'B',
      {
        type: 'RESPOND_TRADE',
        tradeId,
        accept: false,
      },
      rng,
    );
    expect(sRejected.trades).toHaveLength(0);
    expect(sRejected.logs.some((l) => l.includes('từ chối'))).toBe(true);
  });

  it('lá không còn trên tay khi xác nhận: báo lỗi validate', () => {
    const rng = createRng('test-trade-missing-card');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const playerA = state.players.find((p) => p.id === 'A')!;
    const playerB = state.players.find((p) => p.id === 'B')!;

    playerA.hand = [{ instanceId: 'card-a', cardId: 'episode', type: 'episode' }];
    playerB.hand = [{ instanceId: 'card-b', cardId: 'therapy', type: 'therapy' }];

    const s1 = sideEffectsGame.apply(
      state,
      'A',
      {
        type: 'PROPOSE_TRADE',
        targetPlayerId: 'B',
        offerCardIds: ['card-a'],
      },
      rng,
    );
    const tradeId = s1.trades[0]!.tradeId;

    const s2 = sideEffectsGame.apply(
      s1,
      'B',
      {
        type: 'RESPOND_TRADE',
        tradeId,
        accept: true,
        giveCardIds: ['card-b'],
      },
      rng,
    );

    // Trước khi A xác nhận, B bất ngờ mất lá 'card-b' khỏi tay
    const bMutated = s2.players.find((p) => p.id === 'B')!;
    bMutated.hand = [];

    // A cố confirm -> bị từ chối vì lá bài không còn trên tay
    expect(
      sideEffectsGame.validate(s2, 'A', {
        type: 'CONFIRM_TRADE',
        tradeId,
        accept: true,
      }),
    ).toBe('Một số lá bài trong giao dịch không còn trên tay người chơi');
  });

  it('thực hiện được ngoài lượt và không tính vào 2 lá đánh ra', () => {
    const rng = createRng('test-trade-out-of-turn');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    // Giả sử activePlayer là A
    state.activePlayerId = 'A';
    state.cardsPlayedThisTurn = 0;

    const playerA = state.players.find((p) => p.id === 'A')!;
    const playerB = state.players.find((p) => p.id === 'B')!;

    playerA.hand = [{ instanceId: 'a-1', cardId: 'episode', type: 'episode' }];
    playerB.hand = [{ instanceId: 'b-1', cardId: 'therapy', type: 'therapy' }];

    // B là người ngoài lượt, đề xuất trade với A
    const s1 = sideEffectsGame.apply(
      state,
      'B',
      {
        type: 'PROPOSE_TRADE',
        targetPlayerId: 'A',
        offerCardIds: ['b-1'],
      },
      rng,
    );
    expect(s1.trades).toHaveLength(1);

    // A phản hồi
    const tradeId = s1.trades[0]!.tradeId;
    const s2 = sideEffectsGame.apply(
      s1,
      'A',
      {
        type: 'RESPOND_TRADE',
        tradeId,
        accept: true,
        giveCardIds: ['a-1'],
      },
      rng,
    );

    // B xác nhận
    const s3 = sideEffectsGame.apply(
      s2,
      'B',
      {
        type: 'CONFIRM_TRADE',
        tradeId,
        accept: true,
      },
      rng,
    );

    // Không tính vào 2 lá đánh ra của A!
    expect(s3.cardsPlayedThisTurn).toBe(0);
  });

  it('mỗi người tối đa 1 giao dịch đang mở', () => {
    const rng = createRng('test-trade-limit');
    const state = setupSideEffects(['A', 'B', 'C'], {}, rng);
    const pA = state.players.find((p) => p.id === 'A')!;
    const pC = state.players.find((p) => p.id === 'C')!;
    pA.hand = [{ instanceId: 'a-card', cardId: 'episode', type: 'episode' }];
    pC.hand = [{ instanceId: 'c-card', cardId: 'episode', type: 'episode' }];

    // A mở trade với B
    const s1 = sideEffectsGame.apply(
      state,
      'A',
      {
        type: 'PROPOSE_TRADE',
        targetPlayerId: 'B',
        offerCardIds: ['a-card'],
      },
      rng,
    );

    // C cố mở trade với A -> từ chối vì A đã có 1 trade đang mở
    expect(
      sideEffectsGame.validate(s1, 'C', {
        type: 'PROPOSE_TRADE',
        targetPlayerId: 'A',
        offerCardIds: ['c-card'],
      }),
    ).toBe('Mỗi người chơi chỉ có thể tham gia tối đa 1 giao dịch đang mở');

    // A cố mở trade khác với C -> từ chối
    expect(
      sideEffectsGame.validate(s1, 'A', {
        type: 'PROPOSE_TRADE',
        targetPlayerId: 'C',
        offerCardIds: ['a-card'],
      }),
    ).toBe('Mỗi người chơi chỉ có thể tham gia tối đa 1 giao dịch đang mở');
  });
});
