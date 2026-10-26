import { createRng } from '@boardgame/core';
import { describe, expect, it } from 'vitest';
import {
  ALL_EK_CARDS,
  applyGame,
  createPlayerView,
  getCardById,
  setupGame,
  validateGame,
} from '../src/index.js';

describe('Exploding Kittens Pure Engine', () => {
  const rng = createRng('test-seed-kitten-42');
  const players2 = ['alice', 'bob'];
  const players3 = ['alice', 'bob', 'charlie'];
  const players4 = ['alice', 'bob', 'charlie', 'david'];
  const players5 = ['alice', 'bob', 'charlie', 'david', 'eve'];

  describe('1. Setup 6 bước chuẩn (2-5 người chơi)', () => {
    it('Setup cho 2 người chơi chuẩn xác theo bảng định lượng', () => {
      const state = setupGame(players2, {}, rng);
      expect(state.playerOrder).toEqual(players2);
      expect(players2.includes(state.activePlayerId)).toBe(true);
      expect(state.turnsRemaining).toBe(1);

      // Mỗi người 8 lá (7 thường + 1 Defuse)
      for (const pid of players2) {
        const hand = state.players[pid]!.hand;
        expect(hand.length).toBe(8);
        const defuseCount = hand.filter((id) => getCardById(id)?.code === 'DEFUSE').length;
        expect(defuseCount).toBe(1);
      }

      // Draw Pile cho 2 người: đúng 35 lá (32 thường + 2 Defuse + 1 Exploding Kitten)
      expect(state.drawDeck.length).toBe(35);

      const kittensInDeck = state.drawDeck.filter(
        (id) => getCardById(id)?.code === 'EXPLODING_KITTEN'
      ).length;
      expect(kittensInDeck).toBe(1);

      const defusesInDeck = state.drawDeck.filter(
        (id) => getCardById(id)?.code === 'DEFUSE'
      ).length;
      expect(defusesInDeck).toBe(2);
    });

    it('Setup cho 3 người chơi: 29 lá trong Draw Pile', () => {
      const state = setupGame(players3, {}, rng);
      for (const pid of players3) {
        expect(state.players[pid]!.hand.length).toBe(8);
      }
      expect(state.drawDeck.length).toBe(29);
      const kittensInDeck = state.drawDeck.filter(
        (id) => getCardById(id)?.code === 'EXPLODING_KITTEN'
      ).length;
      expect(kittensInDeck).toBe(2);
      const defusesInDeck = state.drawDeck.filter(
        (id) => getCardById(id)?.code === 'DEFUSE'
      ).length;
      expect(defusesInDeck).toBe(2);
    });

    it('Setup cho 4 người chơi: 23 lá trong Draw Pile', () => {
      const state = setupGame(players4, {}, rng);
      for (const pid of players4) {
        expect(state.players[pid]!.hand.length).toBe(8);
      }
      expect(state.drawDeck.length).toBe(23);
      const kittensInDeck = state.drawDeck.filter(
        (id) => getCardById(id)?.code === 'EXPLODING_KITTEN'
      ).length;
      expect(kittensInDeck).toBe(3);
      const defusesInDeck = state.drawDeck.filter(
        (id) => getCardById(id)?.code === 'DEFUSE'
      ).length;
      expect(defusesInDeck).toBe(2);
    });

    it('Setup cho 5 người chơi: 16 lá trong Draw Pile', () => {
      const state = setupGame(players5, {}, rng);
      for (const pid of players5) {
        expect(state.players[pid]!.hand.length).toBe(8);
      }
      expect(state.drawDeck.length).toBe(16);
      const kittensInDeck = state.drawDeck.filter(
        (id) => getCardById(id)?.code === 'EXPLODING_KITTEN'
      ).length;
      expect(kittensInDeck).toBe(4);
      const defusesInDeck = state.drawDeck.filter(
        (id) => getCardById(id)?.code === 'DEFUSE'
      ).length;
      expect(defusesInDeck).toBe(1);
    });

    it('Ném lỗi nếu số người chơi ngoài khoảng 2-5', () => {
      expect(() => setupGame(['single'], {}, rng)).toThrow();
      expect(() =>
        setupGame(['1', '2', '3', '4', '5', '6'], {}, rng)
      ).toThrow();
    });
  });

  describe('2. Kiểm tra tính hợp lệ của hành động (Rule Validation)', () => {
    it('Chặn hành động khi không phải lượt của mình', () => {
      const state = setupGame(players2, {}, rng);
      const nonActivePlayer = state.activePlayerId === 'alice' ? 'bob' : 'alice';
      const err = validateGame(state, nonActivePlayer, { type: 'DRAW_CARD' });
      expect(err).toBe('Chưa đến lượt của bạn');
    });

    it('Không cho phép đánh lẻ lá Mèo Nổ từ trên tay', () => {
      const state = setupGame(players2, {}, rng);
      const active = state.activePlayerId;
      const kittenCard = ALL_EK_CARDS.find((c) => c.code === 'EXPLODING_KITTEN')!;
      state.players[active]!.hand.push(kittenCard.id);

      const err = validateGame(state, active, {
        type: 'PLAY_ACTION_CARD',
        cardId: kittenCard.id,
      });
      expect(err).toBe('Không thể tự đánh lá Mèo Nổ từ trên tay');
    });

    it('Không cho phép đánh lẻ lá Defuse khi không bị nổ', () => {
      const state = setupGame(players2, {}, rng);
      const active = state.activePlayerId;
      const defuseId = state.players[active]!.hand.find(
        (id) => getCardById(id)?.code === 'DEFUSE'
      )!;

      const err = validateGame(state, active, {
        type: 'PLAY_ACTION_CARD',
        cardId: defuseId,
      });
      expect(err).toBe('Lá Gỡ Bom chỉ được dùng khi rút trúng Mèo Nổ');
    });

    it('Không cho phép đánh lẻ một lá Cat card đơn lẻ', () => {
      const state = setupGame(players2, {}, rng);
      const active = state.activePlayerId;
      const catCard = ALL_EK_CARDS.find((c) => c.code.startsWith('CAT_'))!;
      state.players[active]!.hand.push(catCard.id);

      const err = validateGame(state, active, {
        type: 'PLAY_ACTION_CARD',
        cardId: catCard.id,
      });
      expect(err).toBe('Lá bài mèo chỉ có thể đánh theo cặp hoặc bộ tổ hợp');
    });

    it('Không cho phép đánh Nope khi không có Nope Window', () => {
      const state = setupGame(players2, {}, rng);
      const active = state.activePlayerId;
      const nopeCard = ALL_EK_CARDS.find((c) => c.code === 'NOPE')!;
      state.players[active]!.hand.push(nopeCard.id);

      const err = validateGame(state, active, {
        type: 'PLAY_NOPE',
        cardId: nopeCard.id,
      });
      expect(err).toBe('Hiện tại không có hành động nào để Chặn (Nope)');
    });
  });

  describe('3. Xử lý 7 tình huống biên (Edge Cases)', () => {
    // Edge case 1: Đang bị Attack (turnsRemaining = 2) mà đánh ra 1 lá Skip
    it('Edge case 1: Đang bị Attack (nợ 2 lượt) đánh Skip -> turnsRemaining giảm 1 và người đó tiếp tục đi', () => {
      let state = setupGame(players2, {}, rng);
      const active = state.activePlayerId;
      state.turnsRemaining = 2; // Đang nợ 2 lượt

      const skipCard = ALL_EK_CARDS.find((c) => c.code === 'SKIP')!;
      state.players[active]!.hand.push(skipCard.id);

      // Đánh Skip (không ai có Nope -> auto resolve)
      state = applyGame(
        state,
        active,
        { type: 'PLAY_ACTION_CARD', cardId: skipCard.id },
        rng
      );

      // Nếu còn ở Nope window thì resolve
      if (state.phase === 'NOPE_WINDOW') {
        state = applyGame(state, '__system__', { type: 'RESOLVE_NOPE_WINDOW' }, rng);
      }

      expect(state.phase).toBe('TURN_PLAY');
      expect(state.activePlayerId).toBe(active);
      expect(state.turnsRemaining).toBe(1);
    });

    // Edge case 2: Đang bị Attack (nợ 2 lượt) mà đánh tiếp 1 lá Attack mới (Cộng dồn)
    it('Edge case 2: Đang bị Attack (nợ 2 lượt) đánh Attack -> người sau chịu remainingTurns + 2 = 4 lượt', () => {
      let state = setupGame(players2, {}, rng);
      const active = state.activePlayerId;
      const nextPlayer = players2.find((p) => p !== active)!;
      state.turnsRemaining = 2;

      const attackCard = ALL_EK_CARDS.find((c) => c.code === 'ATTACK')!;
      state.players[active]!.hand.push(attackCard.id);

      state = applyGame(
        state,
        active,
        { type: 'PLAY_ACTION_CARD', cardId: attackCard.id },
        rng
      );

      if (state.phase === 'NOPE_WINDOW') {
        state = applyGame(state, '__system__', { type: 'RESOLVE_NOPE_WINDOW' }, rng);
      }

      expect(state.activePlayerId).toBe(nextPlayer);
      expect(state.turnsRemaining).toBe(4); // 2 + 2 = 4
    });

    // Edge case 3: Đang bị Attack (nợ 2 lượt) và rút trúng Mèo Nổ ở lượt đầu tiên
    it('Edge case 3a: Đang bị Attack (nợ 2 lượt), rút Mèo Nổ KHÔNG CÓ DEFUSE -> chết ngay, hủy lượt nợ, chuyển người kế', () => {
      let state = setupGame(players3, {}, rng);
      state.playerOrder = ['alice', 'bob', 'charlie'];
      state.activePlayerId = 'alice';
      state.turnsRemaining = 2;

      // Alice không có Defuse
      state.players['alice']!.hand = [];

      // Đỉnh deck là Mèo Nổ
      const kitten = ALL_EK_CARDS.find((c) => c.code === 'EXPLODING_KITTEN')!;
      state.drawDeck = [kitten.id, 'dummy1', 'dummy2'];

      state = applyGame(state, 'alice', { type: 'DRAW_CARD' }, rng);

      expect(state.players['alice']!.alive).toBe(false);
      expect(state.activePlayerId).toBe('bob');
      expect(state.turnsRemaining).toBe(1); // Lượt nợ của Alice đã hủy
    });

    it('Edge case 3b: Đang bị Attack (nợ 2 lượt), rút Mèo Nổ CÓ DEFUSE -> dùng Defuse chèn lại và PHẢI đi tiếp lượt 2', () => {
      let state = setupGame(players2, {}, rng);
      state.playerOrder = ['alice', 'bob'];
      state.activePlayerId = 'alice';
      state.turnsRemaining = 2;

      // Alice có 1 lá Defuse
      const defuse = ALL_EK_CARDS.find((c) => c.code === 'DEFUSE')!;
      state.players['alice']!.hand = [defuse.id];

      // Đỉnh deck là Mèo Nổ
      const kitten = ALL_EK_CARDS.find((c) => c.code === 'EXPLODING_KITTEN')!;
      state.drawDeck = [kitten.id, 'dummy1', 'dummy2'];

      // Rút trúng Mèo Nổ
      state = applyGame(state, 'alice', { type: 'DRAW_CARD' }, rng);

      expect(state.phase).toBe('DEFUSE_INSERT');
      expect(state.pendingState?.type).toBe('DEFUSE_INSERT');

      // Nhét lại Mèo Nổ vào index 1
      state = applyGame(state, 'alice', { type: 'DEFUSE_INSERT', insertIndex: 1 }, rng);

      expect(state.phase).toBe('TURN_PLAY');
      expect(state.activePlayerId).toBe('alice');
      expect(state.turnsRemaining).toBe(1); // Còn lại 1 lượt phải đi tiếp!
      expect(state.drawDeck[1]).toBe(kitten.id);
    });

    // Edge case 4: Đánh Nope lên một lá Attack hoặc Skip
    it('Edge case 4: Đánh Nope lên lá Attack -> Attack bị hủy, lượt vẫn thuộc về người đánh', () => {
      let state = setupGame(players2, {}, rng);
      state.playerOrder = ['alice', 'bob'];
      state.activePlayerId = 'alice';
      state.turnsRemaining = 1;

      const attackCard = ALL_EK_CARDS.find((c) => c.code === 'ATTACK')!;
      state.players['alice']!.hand.push(attackCard.id);

      const nopeCard = ALL_EK_CARDS.find((c) => c.code === 'NOPE')!;
      state.players['bob']!.hand.push(nopeCard.id);

      // Alice đánh Attack -> mở Nope window
      state = applyGame(
        state,
        'alice',
        { type: 'PLAY_ACTION_CARD', cardId: attackCard.id },
        rng
      );
      expect(state.phase).toBe('NOPE_WINDOW');

      // Bob đánh Nope
      state = applyGame(state, 'bob', { type: 'PLAY_NOPE', cardId: nopeCard.id }, rng);

      // Resolve Nope window
      state = applyGame(state, '__system__', { type: 'RESOLVE_NOPE_WINDOW' }, rng);

      expect(state.phase).toBe('TURN_PLAY');
      expect(state.activePlayerId).toBe('alice'); // Vẫn là lượt của Alice
      expect(state.turnsRemaining).toBe(1);
    });

    // Edge case 5: Chuỗi Nope liên hoàn (Nope chồng lên Nope chẵn/lẻ)
    it('Edge case 5: Chuỗi Nope 2 lá (chẵn) -> thành Yup, hành động gốc vẫn được thực thi', () => {
      let state = setupGame(players2, {}, rng);
      state.playerOrder = ['alice', 'bob'];
      state.activePlayerId = 'alice';
      state.turnsRemaining = 1;

      const attackCard = ALL_EK_CARDS.find((c) => c.code === 'ATTACK')!;
      state.players['alice']!.hand.push(attackCard.id);

      const nopeCards = ALL_EK_CARDS.filter((c) => c.code === 'NOPE');
      const nopeBob = nopeCards[0]!;
      const nopeAlice = nopeCards[1]!;

      state.players['bob']!.hand.push(nopeBob.id);
      state.players['alice']!.hand.push(nopeAlice.id);

      // Alice đánh Attack
      state = applyGame(
        state,
        'alice',
        { type: 'PLAY_ACTION_CARD', cardId: attackCard.id },
        rng
      );

      // Bob đánh Nope 1 (nopeCount = 1, Noped)
      state = applyGame(state, 'bob', { type: 'PLAY_NOPE', cardId: nopeBob.id }, rng);

      // Alice đánh Nope 2 (nopeCount = 2, Yupped!)
      state = applyGame(state, 'alice', { type: 'PLAY_NOPE', cardId: nopeAlice.id }, rng);

      // Resolve
      state = applyGame(state, '__system__', { type: 'RESOLVE_NOPE_WINDOW' }, rng);

      // Vì là số chẵn (2 Nope) -> Attack thành công -> chuyển lượt cho Bob với 2 lượt
      expect(state.phase).toBe('TURN_PLAY');
      expect(state.activePlayerId).toBe('bob');
      expect(state.turnsRemaining).toBe(2);
    });

    // Edge case 6: Đánh Favor vào người có 0 lá trên tay
    it('Edge case 6: Đánh Favor vào người có 0 lá -> Không bị crash, trắng tay', () => {
      let state = setupGame(players2, {}, rng);
      state.playerOrder = ['alice', 'bob'];
      state.activePlayerId = 'alice';

      const favorCard = ALL_EK_CARDS.find((c) => c.code === 'FAVOR')!;
      state.players['alice']!.hand = [favorCard.id];

      // Bob có 0 lá
      state.players['bob']!.hand = [];

      state = applyGame(
        state,
        'alice',
        {
          type: 'PLAY_ACTION_CARD',
          cardId: favorCard.id,
          targetPlayerId: 'bob',
        },
        rng
      );

      if (state.phase === 'NOPE_WINDOW') {
        state = applyGame(state, '__system__', { type: 'RESOLVE_NOPE_WINDOW' }, rng);
      }

      expect(state.phase).toBe('TURN_PLAY');
      expect(state.players['alice']!.hand.includes(favorCard.id)).toBe(false);
      expect(state.players['alice']!.hand.length).toBe(0);
    });

    // Edge case 7: Chồng bài rút còn ít hơn 3 lá khi dùng See the Future
    it('Edge case 7: Chồng bài rút còn 2 lá khi dùng See the Future -> chỉ hiển thị 2 lá, không crash', () => {
      let state = setupGame(players2, {}, rng);
      state.playerOrder = ['alice', 'bob'];
      state.activePlayerId = 'alice';

      const seeFuture = ALL_EK_CARDS.find((c) => c.code === 'SEE_THE_FUTURE')!;
      state.players['alice']!.hand.push(seeFuture.id);

      // Deck chỉ còn đúng 2 lá
      state.drawDeck = ['EK_01', 'EK_02'];

      state = applyGame(
        state,
        'alice',
        { type: 'PLAY_ACTION_CARD', cardId: seeFuture.id },
        rng
      );

      if (state.phase === 'NOPE_WINDOW') {
        state = applyGame(state, '__system__', { type: 'RESOLVE_NOPE_WINDOW' }, rng);
      }

      expect(state.seeTheFutureState?.cardIds.length).toBe(2);
      expect(state.seeTheFutureState?.cardIds).toEqual(['EK_01', 'EK_02']);

      const viewAlice = createPlayerView(state, 'alice');
      expect(viewAlice.knownTopCards?.length).toBe(2);

      const viewBob = createPlayerView(state, 'bob');
      expect(viewBob.knownTopCards).toBeNull(); // Bob không thấy được!
    });
  });

  describe('4. Special Combos (2 lá, 3 lá, 5 lá)', () => {
    it('Two of a Kind: rút mù ngẫu nhiên 1 lá từ tay target', () => {
      let state = setupGame(players2, {}, rng);
      state.playerOrder = ['alice', 'bob'];
      state.activePlayerId = 'alice';

      const tacoCards = ALL_EK_CARDS.filter((c) => c.code === 'CAT_TACOCAT');
      const c1 = tacoCards[0]!;
      const c2 = tacoCards[1]!;

      state.players['alice']!.hand.push(c1.id, c2.id);

      state = applyGame(
        state,
        'alice',
        {
          type: 'PLAY_COMBO',
          comboType: 'TWO_OF_A_KIND',
          cardIds: [c1.id, c2.id],
          targetPlayerId: 'bob',
        },
        rng
      );

      if (state.phase === 'NOPE_WINDOW') {
        state = applyGame(state, '__system__', { type: 'RESOLVE_NOPE_WINDOW' }, rng);
      }

      expect(state.phase).toBe('TURN_PLAY');
      expect(state.players['bob']!.hand.length).toBe(7); // 8 - 1 = 7
      expect(state.players['alice']!.hand.length).toBe(9); // 8 + 2 - 2 + 1 = 9
    });

    it('Three of a Kind: xin trúng Defuse từ target', () => {
      let state = setupGame(players2, {}, rng);
      state.playerOrder = ['alice', 'bob'];
      state.activePlayerId = 'alice';

      const beardCards = ALL_EK_CARDS.filter((c) => c.code === 'CAT_BEARD');
      state.players['alice']!.hand.push(beardCards[0]!.id, beardCards[1]!.id, beardCards[2]!.id);

      // Bob chắc chắn có Defuse
      state = applyGame(
        state,
        'alice',
        {
          type: 'PLAY_COMBO',
          comboType: 'THREE_OF_A_KIND',
          cardIds: [beardCards[0]!.id, beardCards[1]!.id, beardCards[2]!.id],
          targetPlayerId: 'bob',
          requestedCardCode: 'DEFUSE',
        },
        rng
      );

      if (state.phase === 'NOPE_WINDOW') {
        state = applyGame(state, '__system__', { type: 'RESOLVE_NOPE_WINDOW' }, rng);
      }

      // Alice đã lấy được Defuse từ Bob
      const aliceDefuses = state.players['alice']!.hand.filter(
        (id) => getCardById(id)?.code === 'DEFUSE'
      ).length;
      expect(aliceDefuses).toBe(2); // Ban đầu 1 + 1 vừa cướp = 2
    });

    it('Five Different Cards: lấy lại 1 lá bài từ discard pile', () => {
      let state = setupGame(players2, {}, rng);
      state.playerOrder = ['alice', 'bob'];
      state.activePlayerId = 'alice';

      // Tạo 5 lá bài có 5 code khác nhau
      const cards = [
        ALL_EK_CARDS.find((c) => c.code === 'ATTACK')!,
        ALL_EK_CARDS.find((c) => c.code === 'SKIP')!,
        ALL_EK_CARDS.find((c) => c.code === 'SHUFFLE')!,
        ALL_EK_CARDS.find((c) => c.code === 'SEE_THE_FUTURE')!,
        ALL_EK_CARDS.find((c) => c.code === 'CAT_TACOCAT')!,
      ];

      for (const c of cards) {
        state.players['alice']!.hand.push(c.id);
      }

      // Discard Pile có sẵn 1 lá Defuse
      const defuseInDiscard = ALL_EK_CARDS.find((c) => c.code === 'DEFUSE')!;
      state.discardPile = [defuseInDiscard.id];

      state = applyGame(
        state,
        'alice',
        {
          type: 'PLAY_COMBO',
          comboType: 'FIVE_DIFFERENT',
          cardIds: [cards[0]!.id, cards[1]!.id, cards[2]!.id, cards[3]!.id, cards[4]!.id],
        },
        rng
      );

      if (state.phase === 'NOPE_WINDOW') {
        state = applyGame(state, '__system__', { type: 'RESOLVE_NOPE_WINDOW' }, rng);
      }

      expect(state.phase).toBe('FIVE_DIFF_PICK');
      expect(state.pendingState?.type).toBe('FIVE_DIFF_PICK');

      // Alice chọn lấy lại Defuse
      state = applyGame(
        state,
        'alice',
        { type: 'PICK_DISCARD_CARD', cardId: defuseInDiscard.id },
        rng
      );

      expect(state.phase).toBe('TURN_PLAY');
      expect(state.players['alice']!.hand.includes(defuseInDiscard.id)).toBe(true);
    });
  });

  describe('5. Bảo mật thông tin trong PlayerView', () => {
    it('Che giấu hoàn toàn bài đối thủ và thứ tự chồng rút', () => {
      const state = setupGame(players2, {}, rng);
      const view = createPlayerView(state, 'alice');

      expect(view.myHand.length).toBe(8);
      expect(view.opponents[0]?.handCount).toBe(8);
      // Không có trường hand trong đối thủ
      expect((view.opponents[0] as unknown as { hand?: unknown }).hand).toBeUndefined();

      // drawDeck chỉ có số lượng, không có mảng thứ tự
      expect(view.drawDeckCount).toBe(35);
      expect((view as unknown as { drawDeck?: unknown }).drawDeck).toBeUndefined();
    });
  });
});
