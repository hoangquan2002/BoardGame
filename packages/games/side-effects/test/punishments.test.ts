import { createRng } from '@boardgame/core';
import { describe, expect, it } from 'vitest';
import { sideEffectsGame } from '../src/game.js';
import { setupSideEffects } from '../src/setup.js';
import { type SEAction, SYSTEM_PLAYER_ID } from '../src/types.js';

describe('Side Effects Punishments Tests (Task T2)', () => {
  it('Lo âu (anxiety): kẻ gây hại chọn 1 lá từ tay nạn nhân; tay rỗng thì bỏ qua', () => {
    const rng = createRng('test-anxiety');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const attacker = state.players.find((p) => p.id === state.activePlayerId)!;
    const victim = state.players.find((p) => p.id !== state.activePlayerId)!;

    // Đảm bảo victim có anxiety chưa điều trị
    victim.psyche[0]!.disorder.cardId = 'anxiety';
    victim.psyche[0]!.drug = null;

    // Cho victim 2 lá bài
    victim.hand = [
      { instanceId: 'v-card-1', cardId: 'episode', type: 'episode' },
      { instanceId: 'v-card-2', cardId: 'therapy', type: 'therapy' },
    ];
    attacker.hand = [
      { instanceId: 'ep#1', cardId: 'episode', type: 'episode' },
    ];

    const epAction: SEAction = {
      type: 'EPISODE',
      episodeId: 'ep#1',
      targetPlayerId: victim.id,
      disorderId: victim.psyche[0]!.disorder.instanceId,
    };
    const s1 = sideEffectsGame.apply(state, attacker.id, epAction, rng);

    // Có pendingChoice ANXIETY_STEAL cho attacker
    expect(s1.pendingChoice).toEqual({
      type: 'ANXIETY_STEAL',
      playerId: attacker.id,
      victimId: victim.id,
    });

    // Victim cố resolve -> từ chối
    expect(
      sideEffectsGame.validate(s1, victim.id, {
        type: 'RESOLVE_CHOICE',
        cardId: 'v-card-1',
      }),
    ).toBe('Chỉ người chơi được yêu cầu mới có thể giải quyết lựa chọn');

    // Attacker resolve chọn 'v-card-2'
    const resolveAction: SEAction = {
      type: 'RESOLVE_CHOICE',
      cardId: 'v-card-2',
    };
    expect(sideEffectsGame.validate(s1, attacker.id, resolveAction)).toBeNull();
    const s2 = sideEffectsGame.apply(s1, attacker.id, resolveAction, rng);

    expect(s2.pendingChoice).toBeNull();
    const attackerAfter = s2.players.find((p) => p.id === attacker.id)!;
    const victimAfter = s2.players.find((p) => p.id === victim.id)!;
    expect(attackerAfter.hand.some((c) => c.instanceId === 'v-card-2')).toBe(true);
    expect(victimAfter.hand.some((c) => c.instanceId === 'v-card-2')).toBe(false);

    // Trường hợp victim không có bài trên tay -> không tạo pendingChoice
    victimAfter.hand = [];
    attackerAfter.hand = [
      { instanceId: 'ep#2', cardId: 'episode', type: 'episode' },
    ];
    const sEmpty = sideEffectsGame.apply(
      s2,
      attackerAfter.id,
      {
        type: 'EPISODE',
        episodeId: 'ep#2',
        targetPlayerId: victimAfter.id,
        disorderId: victimAfter.psyche[0]!.disorder.instanceId,
      },
      rng,
    );
    expect(sEmpty.pendingChoice).toBeNull();
  });

  it('Chứng run (tremors): chọn 3 lá; timeout mất cả tay; <= 3 lá bỏ hết ngay', () => {
    const rng = createRng('test-tremors');
    const state = setupSideEffects(['A', 'B'], { tremorsTimeoutSeconds: 7 }, rng);
    const attacker = state.players.find((p) => p.id === state.activePlayerId)!;
    const victim = state.players.find((p) => p.id !== state.activePlayerId)!;

    victim.psyche[0]!.disorder.cardId = 'tremors';
    victim.psyche[0]!.drug = null;

    // Trường hợp 1: nạn nhân có 4 lá (> 3 lá) -> tạo pendingChoice cho victim
    victim.hand = [
      { instanceId: 't-1', cardId: 'episode', type: 'episode' },
      { instanceId: 't-2', cardId: 'episode', type: 'episode' },
      { instanceId: 't-3', cardId: 'episode', type: 'episode' },
      { instanceId: 't-4', cardId: 'episode', type: 'episode' },
    ];
    attacker.hand = [
      { instanceId: 'ep-tremors-1', cardId: 'episode', type: 'episode' },
    ];

    const s1 = sideEffectsGame.apply(
      state,
      attacker.id,
      {
        type: 'EPISODE',
        episodeId: 'ep-tremors-1',
        targetPlayerId: victim.id,
        disorderId: victim.psyche[0]!.disorder.instanceId,
      },
      rng,
    );

    expect(s1.pendingChoice).toEqual({
      type: 'TREMORS_DISCARD',
      playerId: victim.id,
      attackerId: attacker.id,
      timeoutSeconds: 7,
    });

    // Nạn nhân chọn đúng 3 lá bỏ -> thành công
    const sResolved = sideEffectsGame.apply(
      s1,
      victim.id,
      {
        type: 'RESOLVE_CHOICE',
        cardIds: ['t-1', 't-2', 't-3'],
      },
      rng,
    );
    expect(sResolved.pendingChoice).toBeNull();
    const victimAfterResolve = sResolved.players.find((p) => p.id === victim.id)!;
    expect(victimAfterResolve.hand).toHaveLength(1);
    expect(victimAfterResolve.hand[0]!.instanceId).toBe('t-4');

    // Trường hợp 2: Chứng run HẾT GIỜ -> CHOICE_TIMEOUT từ SYSTEM_PLAYER_ID mất cả tay
    // Đánh lại episode vào s1
    attacker.hand = [
      { instanceId: 'ep-tremors-timeout', cardId: 'episode', type: 'episode' },
    ];
    victim.hand = [
      { instanceId: 't-1', cardId: 'episode', type: 'episode' },
      { instanceId: 't-2', cardId: 'episode', type: 'episode' },
      { instanceId: 't-3', cardId: 'episode', type: 'episode' },
      { instanceId: 't-4', cardId: 'episode', type: 'episode' },
    ];
    const sTimeoutPending = sideEffectsGame.apply(
      state,
      attacker.id,
      {
        type: 'EPISODE',
        episodeId: 'ep-tremors-timeout',
        targetPlayerId: victim.id,
        disorderId: victim.psyche[0]!.disorder.instanceId,
      },
      rng,
    );

    // Người thường gửi CHOICE_TIMEOUT -> từ chối
    expect(
      sideEffectsGame.validate(sTimeoutPending, attacker.id, {
        type: 'CHOICE_TIMEOUT',
      }),
    ).toBe('Chỉ hệ thống mới có thể kích hoạt hành động này');

    // SYSTEM_PLAYER_ID gửi CHOICE_TIMEOUT -> thành công
    expect(
      sideEffectsGame.validate(sTimeoutPending, SYSTEM_PLAYER_ID, {
        type: 'CHOICE_TIMEOUT',
      }),
    ).toBeNull();
    const sTimedOut = sideEffectsGame.apply(
      sTimeoutPending,
      SYSTEM_PLAYER_ID,
      { type: 'CHOICE_TIMEOUT' },
      rng,
    );
    expect(sTimedOut.pendingChoice).toBeNull();
    const victimTimedOut = sTimedOut.players.find((p) => p.id === victim.id)!;
    expect(victimTimedOut.hand).toHaveLength(0); // Mất toàn bộ bài

    // Trường hợp 3: Nạn nhân có <= 3 lá (ví dụ 2 lá) -> tự động bỏ hết ngay không tạo pendingChoice
    victim.hand = [
      { instanceId: 't-a', cardId: 'episode', type: 'episode' },
      { instanceId: 't-b', cardId: 'episode', type: 'episode' },
    ];
    attacker.hand = [
      { instanceId: 'ep-tremors-small', cardId: 'episode', type: 'episode' },
    ];
    const sAutoDiscard = sideEffectsGame.apply(
      state,
      attacker.id,
      {
        type: 'EPISODE',
        episodeId: 'ep-tremors-small',
        targetPlayerId: victim.id,
        disorderId: victim.psyche[0]!.disorder.instanceId,
      },
      rng,
    );
    expect(sAutoDiscard.pendingChoice).toBeNull();
    const victimAuto = sAutoDiscard.players.find((p) => p.id === victim.id)!;
    expect(victimAuto.hand).toHaveLength(0);
  });

  it('Nghiện cờ bạc (gambling-addiction): tự động lấy ngẫu nhiên min(3, số lá) từ tay nạn nhân', () => {
    const rng = createRng('test-gambling');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const attacker = state.players.find((p) => p.id === state.activePlayerId)!;
    const victim = state.players.find((p) => p.id !== state.activePlayerId)!;

    victim.psyche[0]!.disorder.cardId = 'gambling-addiction';
    victim.psyche[0]!.drug = null;

    // Nạn nhân có 5 lá
    victim.hand = [
      { instanceId: 'g-1', cardId: 'episode', type: 'episode' },
      { instanceId: 'g-2', cardId: 'episode', type: 'episode' },
      { instanceId: 'g-3', cardId: 'episode', type: 'episode' },
      { instanceId: 'g-4', cardId: 'episode', type: 'episode' },
      { instanceId: 'g-5', cardId: 'episode', type: 'episode' },
    ];
    const attackerInitialHandCount = attacker.hand.length;
    attacker.hand.push({
      instanceId: 'ep-gambling',
      cardId: 'episode',
      type: 'episode',
    });

    const nextState = sideEffectsGame.apply(
      state,
      attacker.id,
      {
        type: 'EPISODE',
        episodeId: 'ep-gambling',
        targetPlayerId: victim.id,
        disorderId: victim.psyche[0]!.disorder.instanceId,
      },
      rng,
    );

    expect(nextState.pendingChoice).toBeNull();
    const victimAfter = nextState.players.find((p) => p.id === victim.id)!;
    const attackerAfter = nextState.players.find((p) => p.id === attacker.id)!;

    // Nạn nhân mất đúng 3 lá (còn 2 lá)
    expect(victimAfter.hand).toHaveLength(2);
    // Kẻ gây hại nhận được thêm 3 lá
    expect(attackerAfter.hand).toHaveLength(attackerInitialHandCount + 3);

    // Trường hợp nạn nhân có 1 lá -> lấy 1 lá
    victimAfter.hand = [{ instanceId: 'g-one', cardId: 'therapy', type: 'therapy' }];
    attackerAfter.hand.push({
      instanceId: 'ep-gambling-2',
      cardId: 'episode',
      type: 'episode',
    });
    const nextState2 = sideEffectsGame.apply(
      nextState,
      attackerAfter.id,
      {
        type: 'EPISODE',
        episodeId: 'ep-gambling-2',
        targetPlayerId: victimAfter.id,
        disorderId: victimAfter.psyche[0]!.disorder.instanceId,
      },
      rng,
    );
    expect(
      nextState2.players.find((p) => p.id === victimAfter.id)!.hand,
    ).toHaveLength(0);
  });

  it('Suy nghĩ tự tử (suicidal-thoughts): toàn bộ bài trên tay nạn nhân vào discard', () => {
    const rng = createRng('test-suicide');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const attacker = state.players.find((p) => p.id === state.activePlayerId)!;
    const victim = state.players.find((p) => p.id !== state.activePlayerId)!;

    victim.psyche[0]!.disorder.cardId = 'suicidal-thoughts';
    victim.psyche[0]!.drug = null;
    victim.hand = [
      { instanceId: 's-1', cardId: 'episode', type: 'episode' },
      { instanceId: 's-2', cardId: 'therapy', type: 'therapy' },
      { instanceId: 's-3', cardId: 'chlorpromazine', type: 'drug' },
    ];
    attacker.hand.push({
      instanceId: 'ep-suicide',
      cardId: 'episode',
      type: 'episode',
    });

    const nextState = sideEffectsGame.apply(
      state,
      attacker.id,
      {
        type: 'EPISODE',
        episodeId: 'ep-suicide',
        targetPlayerId: victim.id,
        disorderId: victim.psyche[0]!.disorder.instanceId,
      },
      rng,
    );

    const victimAfter = nextState.players.find((p) => p.id === victim.id)!;
    expect(victimAfter.hand).toHaveLength(0);
    expect(nextState.discardPile.some((c) => c.instanceId === 's-1')).toBe(true);
    expect(nextState.discardPile.some((c) => c.instanceId === 's-2')).toBe(true);
    expect(nextState.discardPile.some((c) => c.instanceId === 's-3')).toBe(true);
  });

  it('Điên loạn (madness): gỡ mọi Thuốc vào discard và làm mất quyền đưa Bệnh Lý qua tác dụng phụ của Thuốc đó', () => {
    const rng = createRng('test-madness');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const attacker = state.players.find((p) => p.id === state.activePlayerId)!;
    const victim = state.players.find((p) => p.id !== state.activePlayerId)!;

    // Victim có madness (chưa điều trị) và một slot có Thuốc Sildenafil (gây Lo âu - anxiety)
    victim.psyche[0]!.disorder.cardId = 'madness';
    victim.psyche[0]!.drug = null;
    victim.psyche[1]!.disorder.cardId = 'impotence';
    victim.psyche[1]!.drug = {
      instanceId: 'sildenafil#test',
      cardId: 'sildenafil',
      type: 'drug',
    };
    // Đảm bảo victim chưa có anxiety
    victim.psyche = victim.psyche.filter((s) => s.disorder.cardId !== 'anxiety');

    // Trước khi bị madness: attacker CÓ THỂ đưa anxiety cho victim vì victim đang dùng Sildenafil
    attacker.hand.push({
      instanceId: 'anxiety#test',
      cardId: 'anxiety',
      type: 'disorder',
    });
    const giveDisorderAction: SEAction = {
      type: 'GIVE_DISORDER',
      disorderCardId: 'anxiety#test',
      targetPlayerId: victim.id,
    };
    expect(
      sideEffectsGame.validate(state, attacker.id, giveDisorderAction),
    ).toBeNull();

    // Giờ attacker đánh Episode vào Madness của victim
    attacker.hand.push({
      instanceId: 'ep-madness',
      cardId: 'episode',
      type: 'episode',
    });
    const stateAfterMadness = sideEffectsGame.apply(
      state,
      attacker.id,
      {
        type: 'EPISODE',
        episodeId: 'ep-madness',
        targetPlayerId: victim.id,
        disorderId: victim.psyche[0]!.disorder.instanceId,
      },
      rng,
    );

    const victimAfter = stateAfterMadness.players.find((p) => p.id === victim.id)!;
    // Thuốc đã bị gỡ về discard
    expect(victimAfter.psyche.every((s) => s.drug === null)).toBe(true);
    expect(
      stateAfterMadness.discardPile.some((c) => c.instanceId === 'sildenafil#test'),
    ).toBe(true);

    // Sau khi bị Madness gỡ Thuốc: attacker KHÔNG THỂ đưa anxiety cho victim nữa!
    expect(
      sideEffectsGame.validate(
        stateAfterMadness,
        attacker.id,
        giveDisorderAction,
      ),
    ).toBe('Người nhận không dùng loại Thuốc nào có tác dụng phụ gây ra Bệnh Lý này');
  });

  it('hình phạt kéo dài (Trầm cảm, Liệt dương, Biếng ăn) và luật cộng dồn', () => {
    const rng = createRng('test-stacking');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const attacker = state.players.find((p) => p.id === state.activePlayerId)!;
    const victim = state.players.find((p) => p.id !== state.activePlayerId)!;

    victim.psyche[0]!.disorder.cardId = 'depression';
    victim.psyche[0]!.drug = null;
    victim.psyche[1]!.disorder.cardId = 'impotence';
    victim.psyche[1]!.drug = null;
    victim.psyche[2]!.disorder.cardId = 'anorexia';
    victim.psyche[2]!.drug = null;

    // Attacker có 2 lá Episode
    attacker.hand = [
      { instanceId: 'ep-1', cardId: 'episode', type: 'episode' },
      { instanceId: 'ep-2', cardId: 'episode', type: 'episode' },
    ];

    // Lần 1: attacker đánh Episode vào depression của victim
    const s1 = sideEffectsGame.apply(
      state,
      attacker.id,
      {
        type: 'EPISODE',
        episodeId: 'ep-1',
        targetPlayerId: victim.id,
        disorderId: victim.psyche[0]!.disorder.instanceId,
      },
      rng,
    );
    expect(s1.players.find((p) => p.id === victim.id)!.skipTurns).toBe(1);

    // Lần 2 (CÙNG LƯỢT của attacker): đánh tiếp Episode thứ 2 vào depression của victim
    const s2 = sideEffectsGame.apply(
      s1,
      attacker.id,
      {
        type: 'EPISODE',
        episodeId: 'ep-2',
        targetPlayerId: victim.id,
        disorderId: victim.psyche[0]!.disorder.instanceId,
      },
      rng,
    );
    // Cùng lượt -> KHÔNG cộng dồn thêm, vẫn là 1!
    expect(s2.players.find((p) => p.id === victim.id)!.skipTurns).toBe(1);

    // Ở lượt khác: kết thúc lượt và sang lượt mới
    const sEndTurn = sideEffectsGame.apply(
      s2,
      attacker.id,
      { type: 'END_TURN' },
      rng,
    );
    // Khi sang lượt tiếp theo, do victim bị skipTurns = 1 nên lượt của victim bị skip ngay!
    // Lượt lại quay về attacker (ván 2 người)
    expect(sEndTurn.activePlayerId).toBe(attacker.id);
    expect(sEndTurn.players.find((p) => p.id === victim.id)!.skipTurns).toBe(0);

    // Ở lượt mới của attacker: attacker đánh tiếp Episode vào depression của victim
    attacker.hand.push({
      instanceId: 'ep-new-turn',
      cardId: 'episode',
      type: 'episode',
    });
    const sDifferentTurn = sideEffectsGame.apply(
      sEndTurn,
      attacker.id,
      {
        type: 'EPISODE',
        episodeId: 'ep-new-turn',
        targetPlayerId: victim.id,
        disorderId: victim.psyche[0]!.disorder.instanceId,
      },
      rng,
    );
    // Ở lượt khác -> cộng dồn thêm thành công (+1)
    expect(
      sDifferentTurn.players.find((p) => p.id === victim.id)!.skipTurns,
    ).toBe(1);

    // Kiểm tra Liệt dương (impotence): lượt tiếp theo không thể đánh bài
    attacker.hand.push({
      instanceId: 'ep-impotence',
      cardId: 'episode',
      type: 'episode',
    });
    const sImpotence = sideEffectsGame.apply(
      sDifferentTurn,
      attacker.id,
      {
        type: 'EPISODE',
        episodeId: 'ep-impotence',
        targetPlayerId: victim.id,
        disorderId: victim.psyche[1]!.disorder.instanceId,
      },
      rng,
    );
    expect(
      sImpotence.players.find((p) => p.id === victim.id)!.preventPlayCardsTurns,
    ).toBe(1);

    // Kiểm tra Chứng biếng ăn (anorexia): không được rút bài đầu lượt
    attacker.hand.push({
      instanceId: 'ep-anorexia',
      cardId: 'episode',
      type: 'episode',
    });
    const sAnorexia = sideEffectsGame.apply(
      sImpotence,
      attacker.id,
      {
        type: 'EPISODE',
        episodeId: 'ep-anorexia',
        targetPlayerId: victim.id,
        disorderId: victim.psyche[2]!.disorder.instanceId,
      },
      rng,
    );
    expect(
      sAnorexia.players.find((p) => p.id === victim.id)!.preventDrawTurns,
    ).toBe(1);
  });
});
