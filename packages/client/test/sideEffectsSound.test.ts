import { describe, expect, it } from 'vitest';
import { resolveSideEffectsSounds, type SESoundSnapshot } from '../src/games/side-effects/soundMapping.js';
import { feedback } from '../src/app/feedback/index.js';

describe('Side Effects Sound & Vibration Mapping (Task T7 / D6)', () => {
  const baseSnap: SESoundSnapshot = {
    activePlayerId: 'bot1',
    winner: null,
    hasIncomingTrade: false,
  };

  it('không phát âm thanh ở lần đầu mount / khôi phục phòng (prev === null)', () => {
    expect(
      resolveSideEffectsSounds(
        null,
        { activePlayerId: 'me', winner: null, hasIncomingTrade: true },
        [{ seq: 1, type: 'EPISODE', actorId: 'bot1', targetId: 'me' }],
        'me',
      ),
    ).toEqual([]);
  });

  it('phát yourTurn khi chuyển từ lượt người khác sang lượt của mình', () => {
    expect(
      resolveSideEffectsSounds(
        baseSnap,
        { ...baseSnap, activePlayerId: 'me' },
        [{ seq: 2, type: 'DRAW_TURN', actorId: 'me', count: 2 }],
        'me',
      ),
    ).toEqual(['yourTurn']);
  });

  it('phát heal khi mình dùng Thuốc hoặc Liệu Pháp, và cardPlay khi đối thủ dùng', () => {
    expect(
      resolveSideEffectsSounds(
        { ...baseSnap, activePlayerId: 'me' },
        { ...baseSnap, activePlayerId: 'me' },
        [{ seq: 3, type: 'TREAT', actorId: 'me', targetId: 'me', cardId: 'lorazepam' }],
        'me',
      ),
    ).toEqual(['heal']);

    expect(
      resolveSideEffectsSounds(
        baseSnap,
        baseSnap,
        [{ seq: 4, type: 'THERAPY', actorId: 'bot1', targetId: 'bot1', cardId: 'therapy' }],
        'me',
      ),
    ).toEqual(['cardPlay']);
  });

  it('phát harmAlert khi mình bị đánh Triệu Chứng, bị đưa Bệnh Lý, bị lấy bài hoặc mất lượt', () => {
    expect(
      resolveSideEffectsSounds(
        baseSnap,
        baseSnap,
        [{ seq: 5, type: 'EPISODE', actorId: 'bot1', targetId: 'me', disorderCardId: 'anxiety' }],
        'me',
      ),
    ).toEqual(['harmAlert']);

    expect(
      resolveSideEffectsSounds(
        baseSnap,
        baseSnap,
        [{ seq: 6, type: 'GIVE_DISORDER', actorId: 'bot1', targetId: 'me', cardId: 'depression' }],
        'me',
      ),
    ).toEqual(['harmAlert']);

    expect(
      resolveSideEffectsSounds(
        baseSnap,
        baseSnap,
        [{ seq: 7, type: 'SKIP_TURN', actorId: 'me', disorderCardId: 'depression' }],
        'me',
      ),
    ).toEqual(['harmAlert']);
  });

  it('phát tradeInvite khi nhận lời mời đổi bài mới', () => {
    expect(
      resolveSideEffectsSounds(
        baseSnap,
        { ...baseSnap, hasIncomingTrade: true },
        [{ seq: 8, type: 'TRADE_PROPOSED', actorId: 'p2', targetId: 'me', count: 1 }],
        'me',
      ),
    ).toEqual(['tradeInvite']);
  });

  it('phát victory khi mình thắng và defeat khi người khác thắng', () => {
    expect(
      resolveSideEffectsSounds(
        { ...baseSnap, activePlayerId: 'me' },
        { ...baseSnap, activePlayerId: 'me', winner: 'me' },
        [{ seq: 9, type: 'TREAT', actorId: 'me', targetId: 'me' }],
        'me',
      ),
    ).toEqual(['victory']);

    expect(
      resolveSideEffectsSounds(
        baseSnap,
        { ...baseSnap, winner: 'bot1' },
        [{ seq: 10, type: 'THERAPY', actorId: 'bot1', targetId: 'bot1' }],
        'me',
      ),
    ).toEqual(['defeat']);
  });

  it('FeedbackService bật/tắt âm thanh và rung độc lập', () => {
    const initialSound = feedback.isSoundEnabled();
    const initialVib = feedback.isVibrationEnabled();

    expect(feedback.toggleSound()).toBe(!initialSound);
    expect(feedback.isVibrationEnabled()).toBe(initialVib);

    expect(feedback.toggleVibration()).toBe(!initialVib);
    expect(feedback.isSoundEnabled()).toBe(!initialSound);

    // Khôi phục mặc định
    feedback.setSoundEnabled(initialSound);
    feedback.setVibrationEnabled(initialVib);
  });
});
