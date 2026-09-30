import { createRng } from '@boardgame/core';
import { describe, expect, it } from 'vitest';
import { sideEffectsGame } from '../src/game.js';
import { setupSideEffects } from '../src/setup.js';
import type { SEAction } from '../src/types.js';

describe('Side Effects Therapy (Liệu Pháp) Tests (Task T2)', () => {
  it('Liệu Pháp lên Bệnh Lý đã có Thuốc: Thuốc vào discard, sau đó không còn bị đưa Bệnh Lý qua tác dụng phụ của Thuốc đó', () => {
    const rng = createRng('test-therapy-with-drug');
    const state = setupSideEffects(['A', 'B'], {}, rng);
    const playerA = state.players.find((p) => p.id === state.activePlayerId)!;
    const opponentB = state.players.find((p) => p.id !== state.activePlayerId)!;

    // Thiết lập slot 0 của A: bệnh Liệt dương (impotence) đã điều trị bằng Thuốc Sildenafil (gây Lo âu - anxiety)
    playerA.psyche[0]!.disorder.cardId = 'impotence';
    playerA.psyche[0]!.drug = {
      instanceId: 'sildenafil#test-therapy',
      cardId: 'sildenafil',
      type: 'drug',
    };
    // Đảm bảo A chưa có anxiety
    playerA.psyche = playerA.psyche.filter((s) => s.disorder.cardId !== 'anxiety');

    // Đối thủ B có lá anxiety trên tay
    opponentB.hand = [
      { instanceId: 'anxiety#from-b', cardId: 'anxiety', type: 'disorder' },
    ];

    // Trước khi dùng Therapy: B có thể đưa anxiety cho A qua tác dụng phụ của Sildenafil
    const giveDisorderAction: SEAction = {
      type: 'GIVE_DISORDER',
      disorderCardId: 'anxiety#from-b',
      targetPlayerId: playerA.id,
    };
    // Giả sử đổi lượt sang B để kiểm tra validate
    const stateWithActiveB = { ...state, activePlayerId: opponentB.id };
    expect(
      sideEffectsGame.validate(stateWithActiveB, opponentB.id, giveDisorderAction),
    ).toBeNull();

    // Giờ A dùng Liệu Pháp lên slot impotence đang có Sildenafil
    playerA.hand.push({
      instanceId: 'therapy#test-play',
      cardId: 'therapy',
      type: 'therapy',
    });
    const therapyAction: SEAction = {
      type: 'THERAPY',
      therapyId: 'therapy#test-play',
      disorderId: playerA.psyche[0]!.disorder.instanceId,
    };
    expect(sideEffectsGame.validate(state, playerA.id, therapyAction)).toBeNull();

    const stateAfterTherapy = sideEffectsGame.apply(
      state,
      playerA.id,
      therapyAction,
      rng,
    );

    // Kiểm tra:
    // 1. Cả lá Therapy, Bệnh Lý và Thuốc đều vào discardPile
    expect(
      stateAfterTherapy.discardPile.some(
        (c) => c.instanceId === 'therapy#test-play',
      ),
    ).toBe(true);
    expect(
      stateAfterTherapy.discardPile.some(
        (c) => c.instanceId === playerA.psyche[0]!.disorder.instanceId,
      ),
    ).toBe(true);
    expect(
      stateAfterTherapy.discardPile.some(
        (c) => c.instanceId === 'sildenafil#test-therapy',
      ),
    ).toBe(true);

    // 2. Slot đó bị xoá khỏi Thể Trạng của A
    const aAfter = stateAfterTherapy.players.find((p) => p.id === playerA.id)!;
    expect(
      aAfter.psyche.some(
        (s) => s.disorder.instanceId === playerA.psyche[0]!.disorder.instanceId,
      ),
    ).toBe(false);

    // 3. Sau đó, B cố đưa Bệnh Lý anxiety cho A qua tác dụng phụ của Sildenafil -> BỊ TỪ CHỐI
    const stateAfterWithActiveB = {
      ...stateAfterTherapy,
      activePlayerId: opponentB.id,
    };
    expect(
      sideEffectsGame.validate(
        stateAfterWithActiveB,
        opponentB.id,
        giveDisorderAction,
      ),
    ).toBe('Người nhận không dùng loại Thuốc nào có tác dụng phụ gây ra Bệnh Lý này');
  });
});
