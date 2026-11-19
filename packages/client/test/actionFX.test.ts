import { describe, expect, it } from 'vitest';
import { getCardById } from '@boardgame/game-exploding-kittens';
import { mapSideEffectsEventsToFX } from '../src/games/side-effects/actionFXMapper.js';
import { mapExplodingKittensEventsToFX } from '../src/games/exploding-kittens/actionFXMapper.js';

describe('ActionFX Mappers (Side Effects & Exploding Kittens)', () => {
  const playerNames: Record<string, string> = {
    me: 'An',
    bot1: '🤖 Máy 1',
    p2: 'Bình',
  };

  describe('Side Effects mapper', () => {
    it('phân loại đúng self, urgent-me, silent và chuỗi fallback anchors', () => {
      const fx = mapSideEffectsEventsToFX(
        [
          {
            seq: 1,
            type: 'TREAT',
            actorId: 'me',
            targetId: 'me',
            cardId: 'fluoxetine',
            disorderCardId: 'depression',
            disorderInstanceId: 'slot-1',
            actorHandInstanceId: 'hand-1',
          },
          {
            seq: 2,
            type: 'EPISODE',
            actorId: 'bot1',
            targetId: 'me',
            cardId: 'episode',
            disorderCardId: 'gambling-addiction',
            disorderInstanceId: 'slot-2',
            punishmentSummary: 'GAMBLING_STEAL',
            count: 2,
          },
          {
            seq: 3,
            type: 'DRAW_TURN',
            actorId: 'bot1',
            count: 2,
          },
          {
            seq: 4,
            type: 'ANXIETY_STEAL',
            actorId: 'bot1',
            targetId: 'p2',
            count: 1,
          },
        ],
        'me',
        playerNames,
      );

      expect(fx).toHaveLength(4);

      // 1. Tự đánh Thuốc -> priority = self, bay tới slot của mình
      expect(fx[0]!.priority).toBe('self');
      expect(fx[0]!.flights?.[0]?.fromAnchors[0]).toBe('se-hand-card-hand-1');
      expect(fx[0]!.flights?.[0]?.toAnchors).toEqual(['se-self-slot-slot-1', 'se-self-psyche']);

      // 2. Bị đánh Triệu Chứng Nghiện cờ bạc -> priority = urgent-me, 2 lá bay (Episode + bài bị cướp)
      expect(fx[1]!.priority).toBe('urgent-me');
      expect(fx[1]!.flights).toHaveLength(2);
      expect(fx[1]!.impacts?.[0]?.shake).toBe(true);

      // 3. Rút bài đầu lượt -> silent (không vào hàng đợi chữ), bay mặt úp từ chồng rút
      expect(fx[2]!.priority).toBe('silent');
      expect(fx[2]!.flights?.[0]?.imageSrc).toBe('/cards/back.jpg');
      expect(fx[2]!.flights?.[0]?.fromAnchors).toEqual(['se-draw-pile']);

      // 4. Người ngoài quan sát Lo âu -> bay mặt úp /cards/back.jpg
      expect(fx[3]!.priority).toBe('normal');
      expect(fx[3]!.flights?.[0]?.imageSrc).toBe('/cards/back.jpg');
    });
  });

  describe('Exploding Kittens mapper', () => {
    const getName = (id: string) => (id === 'me' ? 'Bạn' : playerNames[id] ?? id);

    it('phân loại đúng Attack nhắm vào mình, Favor che mặt bài với người ngoài, và chống lặp NopeBanner', () => {
      const attackCard = getCardById('AT_01')!;
      const skipCard = getCardById('SK_01')!;

      const fx = mapExplodingKittensEventsToFX(
        [
          {
            seq: 1,
            type: 'ACTION_PENDING_NOPE',
            actorId: 'bot1',
            card: skipCard,
          },
          {
            seq: 2,
            type: 'ATTACK_RESOLVED',
            actorId: 'bot1',
            targetId: 'me',
            card: attackCard,
            turnsCount: 2,
            wasAfterNopeWindow: false,
          },
          {
            seq: 3,
            type: 'FAVOR_GIVEN',
            actorId: 'p2',
            targetId: 'bot1',
            // Người ngoài không có revealedCard
          },
          {
            seq: 4,
            type: 'DRAW_SAFE',
            actorId: 'bot1',
            turnsCount: 0,
          },
        ],
        'me',
        getName,
      );

      expect(fx).toHaveLength(4);

      // 1. ACTION_PENDING_NOPE không nhắm vào mình -> silent (để tránh lặp chữ với NopeBanner), vẫn bay lá vào chồng bỏ
      expect(fx[0]!.priority).toBe('silent');
      expect(fx[0]!.flights?.[0]?.toAnchors).toEqual(['ek-discard-pile']);

      // 2. Attack nhắm vào mình -> urgent-me, rung ghế/tay
      expect(fx[1]!.priority).toBe('urgent-me');
      expect(fx[1]!.impacts?.[0]?.shake).toBe(true);

      // 3. Favor giữa 2 người khác -> bay lá mặt sau card-back.png
      expect(fx[2]!.priority).toBe('normal');
      expect(fx[2]!.flights?.[0]?.imageSrc).toBe('/games/exploding-kittens/cards/card-back.png');

      // 4. Rút an toàn -> silent + lá úp bay từ chồng rút
      expect(fx[3]!.priority).toBe('silent');
      expect(fx[3]!.flights?.[0]?.fromAnchors).toEqual(['ek-draw-pile']);
    });
  });
});
