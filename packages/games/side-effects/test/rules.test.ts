import { createRng } from '@boardgame/core';
import { describe, expect, it } from 'vitest';
import { cardsData } from '../src/deck.js';
import { sideEffectsGame } from '../src/game.js';
import { setupSideEffects } from '../src/setup.js';
import type { SEAction, SEState } from '../src/types.js';

describe('Side Effects Rules Tests (Task T2)', () => {
  it('chia bài không trùng Bệnh Lý trong Thể Trạng (4 lá cho 2-5 người, 3 lá khi >= 6 người)', () => {
    const rng = createRng('test-setup-rng-1');
    // Test 3 players (nhận 4 Bệnh Lý)
    const state3 = setupSideEffects(['A', 'B', 'C'], {}, rng);
    expect(state3.players).toHaveLength(3);
    for (const p of state3.players) {
      expect(p.psyche).toHaveLength(4);
      const disorderIds = p.psyche.map((s) => s.disorder.cardId);
      expect(new Set(disorderIds).size).toBe(4);
      for (const slot of p.psyche) {
        expect(slot.drug).toBeNull();
      }
    }

    // Test 6 players (nhận 3 Bệnh Lý)
    const state6 = setupSideEffects(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], {}, rng);
    expect(state6.players).toHaveLength(6);
    for (const p of state6.players) {
      expect(p.psyche).toHaveLength(3);
      const disorderIds = p.psyche.map((s) => s.disorder.cardId);
      expect(new Set(disorderIds).size).toBe(3);
    }

    // Test 8 players (nhận 3 Bệnh Lý)
    const state8 = setupSideEffects(
      ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
      {},
      rng,
    );
    expect(state8.players).toHaveLength(8);
    for (const p of state8.players) {
      expect(p.psyche).toHaveLength(3);
      const disorderIds = p.psyche.map((s) => s.disorder.cardId);
      expect(new Set(disorderIds).size).toBe(3);
    }
  });

  it('rút 2 lá đầu lượt, chơi tối đa 2 lá mỗi lượt, giới hạn 6 lá cuối lượt', () => {
    const rng = createRng('test-turn-flow');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const activeId = state.activePlayerId;
    const activePlayer = state.players.find((p) => p.id === activeId)!;

    // Người đi trước đã tự động rút 2 lá (4 lá tay ban đầu + 2 lá rút = 6 lá)
    expect(activePlayer.hand).toHaveLength(6);

    // Chuẩn bị 3 lá bài hợp lệ để đánh: giả sử cho activePlayer 3 lá thuốc chữa đúng bệnh của họ
    const disorder1 = activePlayer.psyche[0]!.disorder.cardId;
    const disorder2 = activePlayer.psyche[1]!.disorder.cardId;
    const drug1Def = cardsData.drugs.find((d) => d.treats === disorder1)!;
    const drug2Def = cardsData.drugs.find((d) => d.treats === disorder2)!;

    activePlayer.hand[0] = {
      instanceId: 'test-drug-1',
      cardId: drug1Def.id,
      type: 'drug',
    };
    activePlayer.hand[1] = {
      instanceId: 'test-drug-2',
      cardId: drug2Def.id,
      type: 'drug',
    };
    activePlayer.hand[2] = {
      instanceId: 'test-drug-3',
      cardId: drug1Def.id,
      type: 'drug',
    };

    // Đánh lá thứ 1
    const action1: SEAction = {
      type: 'TREAT',
      drugId: 'test-drug-1',
      disorderId: activePlayer.psyche[0]!.disorder.instanceId,
    };
    expect(sideEffectsGame.validate(state, activeId, action1)).toBeNull();
    const stateAfter1 = sideEffectsGame.apply(state, activeId, action1, rng);
    expect(stateAfter1.cardsPlayedThisTurn).toBe(1);

    // Đánh lá thứ 2
    const action2: SEAction = {
      type: 'TREAT',
      drugId: 'test-drug-2',
      disorderId: activePlayer.psyche[1]!.disorder.instanceId,
    };
    expect(sideEffectsGame.validate(stateAfter1, activeId, action2)).toBeNull();
    const stateAfter2 = sideEffectsGame.apply(stateAfter1, activeId, action2, rng);
    expect(stateAfter2.cardsPlayedThisTurn).toBe(2);

    // Cố đánh lá thứ 3 -> bị từ chối
    const action3: SEAction = {
      type: 'TREAT',
      drugId: 'test-drug-3',
      disorderId: activePlayer.psyche[2]!.disorder.instanceId,
    };
    expect(sideEffectsGame.validate(stateAfter2, activeId, action3)).toBe(
      'Bạn đã đánh tối đa 2 lá trong lượt này',
    );

    // Giới hạn 6 lá cuối lượt: thêm bài để tay có 8 lá
    const playerWith8 = stateAfter2.players.find((p) => p.id === activeId)!;
    while (playerWith8.hand.length < 8) {
      playerWith8.hand.push({
        instanceId: `extra#${playerWith8.hand.length}`,
        cardId: 'episode',
        type: 'episode',
      });
    }

    // END_TURN bị từ chối khi tay > 6
    expect(sideEffectsGame.validate(stateAfter2, activeId, { type: 'END_TURN' })).toBe(
      'Bạn phải bỏ bớt bài trên tay xuống còn 6 lá trước khi kết thúc lượt',
    );

    // Bỏ sai số lượng -> từ chối (có 8 lá, phải bỏ 2 lá, nếu bỏ 1 lá bị từ chối)
    expect(
      sideEffectsGame.validate(stateAfter2, activeId, {
        type: 'DISCARD',
        cardIds: [playerWith8.hand[0]!.instanceId],
      }),
    ).toBe('Bạn phải bỏ chính xác 2 lá bài để còn lại 6 lá trên tay');

    // Bỏ đúng 2 lá -> thành công
    const discardAction: SEAction = {
      type: 'DISCARD',
      cardIds: [playerWith8.hand[0]!.instanceId, playerWith8.hand[1]!.instanceId],
    };
    expect(sideEffectsGame.validate(stateAfter2, activeId, discardAction)).toBeNull();
    const stateAfterDiscard = sideEffectsGame.apply(
      stateAfter2,
      activeId,
      discardAction,
      rng,
    );
    expect(
      stateAfterDiscard.players.find((p) => p.id === activeId)!.hand,
    ).toHaveLength(6);

    // Giờ END_TURN hợp lệ
    expect(
      sideEffectsGame.validate(stateAfterDiscard, activeId, { type: 'END_TURN' }),
    ).toBeNull();
  });

  it('không thể đưa Bệnh Lý trùng loại vào Thể Trạng (kể cả đã điều trị)', () => {
    const rng = createRng('test-duplicate-disorder');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const activePlayer = state.players.find((p) => p.id === state.activePlayerId)!;
    const opponent = state.players.find((p) => p.id !== state.activePlayerId)!;

    // Giả sử opponent đã có Bệnh Lý "anxiety" trong Thể Trạng
    opponent.psyche[0]!.disorder.cardId = 'anxiety';
    // Opponent có sildenafil (tác dụng phụ: anxiety)
    opponent.psyche[1]!.drug = {
      instanceId: 'sildenafil#1',
      cardId: 'sildenafil',
      type: 'drug',
    };

    // Active player có lá anxiety trên tay
    activePlayer.hand.push({
      instanceId: 'anxiety#99',
      cardId: 'anxiety',
      type: 'disorder',
    });

    // Cố tình đưa anxiety cho opponent -> bị từ chối vì opponent đã có anxiety
    const giveAction: SEAction = {
      type: 'GIVE_DISORDER',
      disorderCardId: 'anxiety#99',
      targetPlayerId: opponent.id,
    };
    expect(sideEffectsGame.validate(state, activePlayer.id, giveAction)).toBe(
      'Người nhận đã có Bệnh Lý này trong Thể Trạng',
    );
  });

  it('điều kiện đưa Bệnh Lý: chỉ đưa được khi đối thủ có Thuốc gây tác dụng phụ đó và chưa có bệnh đó', () => {
    const rng = createRng('test-give-disorder-rules');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const activePlayer = state.players.find((p) => p.id === state.activePlayerId)!;
    const opponent = state.players.find((p) => p.id !== state.activePlayerId)!;

    // Opponent không có Thuốc nào trên Thể Trạng và chưa có anxiety
    opponent.psyche = opponent.psyche.filter((s) => s.disorder.cardId !== 'anxiety');
    for (const slot of opponent.psyche) {
      slot.drug = null;
    }
    // Cho activePlayer lá "anxiety" trên tay
    activePlayer.hand.push({
      instanceId: 'anxiety#100',
      cardId: 'anxiety',
      type: 'disorder',
    });

    // Cố đưa khi đối thủ không có Thuốc gây ra tác dụng phụ đó -> từ chối
    const actionFail: SEAction = {
      type: 'GIVE_DISORDER',
      disorderCardId: 'anxiety#100',
      targetPlayerId: opponent.id,
    };
    expect(sideEffectsGame.validate(state, activePlayer.id, actionFail)).toBe(
      'Người nhận không dùng loại Thuốc nào có tác dụng phụ gây ra Bệnh Lý này',
    );

    // Giờ cho opponent uống Sildenafil (điều trị impotence, gây ra tác dụng phụ anxiety)
    // Đảm bảo opponent chưa có anxiety
    opponent.psyche = opponent.psyche.filter((s) => s.disorder.cardId !== 'anxiety');
    opponent.psyche[0]!.drug = {
      instanceId: 'sildenafil#1',
      cardId: 'sildenafil',
      type: 'drug',
    };

    // Giờ đưa Bệnh Lý anxiety -> thành công!
    expect(sideEffectsGame.validate(state, activePlayer.id, actionFail)).toBeNull();
    const nextState = sideEffectsGame.apply(state, activePlayer.id, actionFail, rng);
    const updatedOpponent = nextState.players.find((p) => p.id === opponent.id)!;
    expect(
      updatedOpponent.psyche.some((s) => s.disorder.cardId === 'anxiety'),
    ).toBe(true);
  });

  it('Episode chỉ đánh vào Bệnh Lý chưa điều trị của đối thủ', () => {
    const rng = createRng('test-episode-rules');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const activePlayer = state.players.find((p) => p.id === state.activePlayerId)!;
    const opponent = state.players.find((p) => p.id !== state.activePlayerId)!;

    activePlayer.hand.push({
      instanceId: 'episode#test',
      cardId: 'episode',
      type: 'episode',
    });

    // Đánh vào chính mình -> từ chối
    const selfEpisode: SEAction = {
      type: 'EPISODE',
      episodeId: 'episode#test',
      targetPlayerId: activePlayer.id,
      disorderId: activePlayer.psyche[0]!.disorder.instanceId,
    };
    expect(sideEffectsGame.validate(state, activePlayer.id, selfEpisode)).toBe(
      'Không thể đánh Triệu Chứng vào chính mình',
    );

    // Đánh vào Bệnh Lý đã điều trị của đối thủ -> từ chối
    opponent.psyche[0]!.drug = {
      instanceId: 'test-drug',
      cardId: 'chlorpromazine',
      type: 'drug',
    };
    const treatedEpisode: SEAction = {
      type: 'EPISODE',
      episodeId: 'episode#test',
      targetPlayerId: opponent.id,
      disorderId: opponent.psyche[0]!.disorder.instanceId,
    };
    expect(sideEffectsGame.validate(state, activePlayer.id, treatedEpisode)).toBe(
      'Không thể đánh Triệu Chứng vào Bệnh Lý đã được điều trị',
    );

    // Đánh vào Bệnh Lý chưa điều trị của đối thủ -> thành công
    const untreatedEpisode: SEAction = {
      type: 'EPISODE',
      episodeId: 'episode#test',
      targetPlayerId: opponent.id,
      disorderId: opponent.psyche[1]!.disorder.instanceId,
    };
    expect(sideEffectsGame.validate(state, activePlayer.id, untreatedEpisode)).toBeNull();
  });

  it('Tremors không dùng Liệu Pháp được (miễn nhiễm với Liệu Pháp)', () => {
    const rng = createRng('test-tremors-therapy');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const activePlayer = state.players.find((p) => p.id === state.activePlayerId)!;

    activePlayer.psyche[0]!.disorder.cardId = 'tremors';
    activePlayer.hand.push({
      instanceId: 'therapy#test',
      cardId: 'therapy',
      type: 'therapy',
    });

    const action: SEAction = {
      type: 'THERAPY',
      therapyId: 'therapy#test',
      disorderId: activePlayer.psyche[0]!.disorder.instanceId,
    };
    expect(sideEffectsGame.validate(state, activePlayer.id, action)).toBe(
      'Chứng run miễn nhiễm với Liệu Pháp',
    );
  });

  it('Anorexia không có Thuốc nào điều trị được', () => {
    const drugTreatingAnorexia = cardsData.drugs.find((d) => d.treats === 'anorexia');
    expect(drugTreatingAnorexia).toBeUndefined();
  });

  it('hết chồng rút tự động xáo chồng bài bỏ, cả hai hết thì rút được bao nhiêu rút bấy nhiêu', () => {
    const rng = createRng('test-deck-reshuffle');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const activeId = state.activePlayerId;

    // Làm rỗng drawPile, bỏ 3 lá vào discardPile
    state.drawPile = [];
    state.discardPile = [
      { instanceId: 'disc#1', cardId: 'episode', type: 'episode' },
      { instanceId: 'disc#2', cardId: 'episode', type: 'episode' },
      { instanceId: 'disc#3', cardId: 'episode', type: 'episode' },
    ];

    // Kết thúc lượt -> người tiếp theo rút bài, kích hoạt xáo discardPile thành drawPile
    const nextState = sideEffectsGame.apply(
      state,
      activeId,
      { type: 'END_TURN' },
      rng,
    );
    expect(nextState.logs.some((l) => l.includes('xáo lại chồng bài bỏ'))).toBe(true);

    // Người tiếp theo đã rút được 2 lá từ 3 lá vừa xáo
    const nextPlayer = nextState.players.find((p) => p.id === nextState.activePlayerId)!;
    expect(nextState.drawPile.length).toBe(1);
    expect(nextState.discardPile.length).toBe(0);
    expect(nextPlayer.hand.length).toBeGreaterThanOrEqual(2);

    // Trường hợp cả hai chồng đều hết
    nextState.drawPile = [];
    nextState.discardPile = [];
    const stateBothEmpty = sideEffectsGame.apply(
      nextState,
      nextState.activePlayerId,
      { type: 'END_TURN' },
      rng,
    );
    // Không crash, drawPile vẫn rỗng
    expect(stateBothEmpty.drawPile).toHaveLength(0);
    expect(stateBothEmpty.discardPile).toHaveLength(0);
  });

  it('điều kiện thắng: mọi Bệnh Lý trong Thể Trạng đã có Thuốc hoặc Thể Trạng rỗng', () => {
    const rng = createRng('test-win-condition');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const activePlayer = state.players.find((p) => p.id === state.activePlayerId)!;

    // Giả sử Thể Trạng của activePlayer có 4 bệnh, ta điều trị 3 bệnh trước
    for (let i = 0; i < activePlayer.psyche.length - 1; i++) {
      activePlayer.psyche[i]!.drug = {
        instanceId: `drug-win#${i}`,
        cardId: 'chlorpromazine',
        type: 'drug',
      };
    }
    expect(sideEffectsGame.winner(state)).toBeNull();

    // Dùng Thuốc chữa bệnh cuối cùng
    const lastSlot = activePlayer.psyche[activePlayer.psyche.length - 1]!;
    const matchingDrug = cardsData.drugs.find((d) => d.treats === lastSlot.disorder.cardId)!;
    activePlayer.hand.push({
      instanceId: 'winning-drug',
      cardId: matchingDrug.id,
      type: 'drug',
    });

    const winAction: SEAction = {
      type: 'TREAT',
      drugId: 'winning-drug',
      disorderId: lastSlot.disorder.instanceId,
    };
    const stateWin = sideEffectsGame.apply(state, activePlayer.id, winAction, rng);
    expect(sideEffectsGame.winner(stateWin)).toBe(activePlayer.id);

    // Sau khi thắng, mọi action tiếp theo đều bị từ chối
    expect(
      sideEffectsGame.validate(stateWin, activePlayer.id, { type: 'END_TURN' }),
    ).toBe('Ván chơi đã kết thúc');

    // Thể Trạng rỗng (bị Therapy bỏ hết) cũng là thắng
    const stateEmptyPsyche = setupSideEffects(['A', 'B'], {}, rng);
    stateEmptyPsyche.players[0]!.psyche = [];
    const checkState: SEState = { ...stateEmptyPsyche, winner: null };
    // Trigger action kiểm tra
    expect(
      sideEffectsGame.apply(
        checkState,
        checkState.activePlayerId,
        { type: 'END_TURN' },
        rng,
      ).winner,
    ).toBe('A');
  });

  it('hỗ trợ options.playerNames trong log và fallback về id khi không có tên', () => {
    const rng = createRng('test-player-names');
    const stateWithNames = setupSideEffects(
      ['user_1', 'user_2'],
      {
        playerNames: {
          user_1: 'Nguyễn Văn An',
          user_2: 'Trần Thị Bình',
        },
      },
      rng,
    );

    const activeName =
      stateWithNames.activePlayerId === 'user_1' ? 'Nguyễn Văn An' : 'Trần Thị Bình';
    expect(stateWithNames.logs[0]).toContain(activeName);
    expect(stateWithNames.logs[0]).not.toContain(stateWithNames.activePlayerId);

    // Test fallback về ID khi không truyền playerNames
    const stateWithoutNames = setupSideEffects(['user_1', 'user_2'], {}, rng);
    expect(stateWithoutNames.logs[0]).toContain(stateWithoutNames.activePlayerId);
  });
});
