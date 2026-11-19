import {
  getCardCodeNameVi,
  type EKCard,
  type EKGameEventView,
} from '@boardgame/game-exploding-kittens';
import type { ActionFXItem, ActionFXPriority, FlyingCardSpec } from '../../app/actionFX/index.js';

const EK_ASPECT = '720 / 1012';
const EK_BACK_IMG = '/games/exploding-kittens/cards/card-back.png';

function getEKCardImg(card?: EKCard | null): string {
  if (!card) return EK_BACK_IMG;
  if (card.imageUrl) return card.imageUrl;
  if (card.imageFile) return `/games/exploding-kittens/cards/${card.imageFile}`;
  return EK_BACK_IMG;
}

function getOriginAnchors(playerId: string, myId: string, cardId?: string): string[] {
  if (playerId === myId) {
    return cardId ? [`ek-hand-card-${cardId}`, 'ek-self-hand'] : ['ek-self-hand'];
  }
  return [`ek-seat-${playerId}`];
}

function getTargetAnchors(playerId: string, myId: string): string[] {
  return playerId === myId ? ['ek-self-hand'] : [`ek-seat-${playerId}`];
}

export function mapExplodingKittensEventsToFX(
  events: EKGameEventView[] | undefined,
  myId: string,
  getPlayerName: (id: string) => string,
): ActionFXItem[] {
  if (!events || events.length === 0) return [];

  return events.map((ev): ActionFXItem => {
    const actor = getPlayerName(ev.actorId);
    const target = ev.targetId ? getPlayerName(ev.targetId) : '';
    const actorSeatAnchor = ev.actorId !== myId ? `ek-seat-${ev.actorId}` : undefined;

    switch (ev.type) {
      case 'ACTION_PENDING_NOPE': {
        const cardImg = getEKCardImg(ev.card);
        const isTargetingMe = Boolean(ev.targetId && ev.targetId === myId);
        const label = ev.comboType
          ? ev.comboType === 'TWO_OF_A_KIND'
            ? 'Combo 2 lá'
            : ev.comboType === 'THREE_OF_A_KIND'
              ? 'Combo 3 lá'
              : 'Combo 5 lá'
          : ev.card?.nameEn ?? 'lá hành động';

        return {
          seq: ev.seq,
          // NopeBanner is open at the same time; only show extra urgent pill when directly targeting me
          priority: isTargetingMe ? 'urgent-me' : 'silent',
          tone: 'amber',
          actorAnchor: actorSeatAnchor,
          flights: [
            {
              imageSrc: cardImg,
              aspectRatio: EK_ASPECT,
              fromAnchors: getOriginAnchors(ev.actorId, myId, ev.card?.id),
              toAnchors: ['ek-discard-pile'],
              tone: 'amber',
            },
          ],
          impacts: ev.targetId
            ? [{ anchors: getTargetAnchors(ev.targetId, myId), tone: 'amber', shake: isTargetingMe }]
            : undefined,
          message: isTargetingMe ? (
            <span>
              <strong>{actor}</strong> nhắm <strong>{label}</strong> vào <strong>Bạn</strong> — có
              thể chặn bằng Nope!
            </span>
          ) : undefined,
        };
      }

      case 'NOPE_PLAYED': {
        const nopeImg = getEKCardImg(ev.card);
        const priority: ActionFXPriority =
          ev.targetId === myId ? 'urgent-me' : ev.actorId === myId ? 'self' : 'normal';
        const isNoped = ev.isCurrentlyNoped ?? true;

        return {
          seq: ev.seq,
          priority,
          tone: isNoped ? 'ruby' : 'gold',
          actorAnchor: actorSeatAnchor,
          flights: [
            {
              imageSrc: nopeImg,
              aspectRatio: EK_ASPECT,
              fromAnchors: getOriginAnchors(ev.actorId, myId, ev.card?.id),
              toAnchors: ['ek-discard-pile'],
              tone: isNoped ? 'ruby' : 'gold',
            },
          ],
          impacts: [{ anchors: ['ek-discard-pile'], tone: isNoped ? 'ruby' : 'gold', shake: true }],
          message: isNoped ? (
            <span>
              <strong>{actor}</strong> tung <strong style={{ color: '#f87171' }}>NOPE!</strong> chặn
              hành động (x{ev.nopeCount ?? 1})
            </span>
          ) : (
            <span>
              <strong>{actor}</strong> tung{' '}
              <strong style={{ color: '#fde047' }}>YUP! (Nope x{ev.nopeCount ?? 2})</strong> bật lại
              hành động!
            </span>
          ),
        };
      }

      case 'ACTION_NOPED': {
        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'urgent-me' : 'normal',
          tone: 'ruby',
          impacts: [{ anchors: getTargetAnchors(ev.actorId, myId), tone: 'ruby', shake: true }],
          message: (
            <span>
              Hành động của <strong>{actor}</strong> đã bị{' '}
              <strong style={{ color: '#f87171' }}>NOPE vô hiệu hoá!</strong>
            </span>
          ),
        };
      }

      case 'ATTACK_RESOLVED': {
        const priority: ActionFXPriority =
          ev.targetId === myId ? 'urgent-me' : ev.actorId === myId ? 'self' : 'normal';
        return {
          seq: ev.seq,
          priority,
          tone: 'ruby',
          actorAnchor: actorSeatAnchor,
          flights: !ev.wasAfterNopeWindow
            ? [
                {
                  imageSrc: getEKCardImg(ev.card),
                  aspectRatio: EK_ASPECT,
                  fromAnchors: getOriginAnchors(ev.actorId, myId, ev.card?.id),
                  toAnchors: ['ek-discard-pile'],
                  tone: 'ruby',
                },
              ]
            : undefined,
          impacts: ev.targetId
            ? [{ anchors: getTargetAnchors(ev.targetId, myId), tone: 'ruby', shake: true }]
            : undefined,
          message: (
            <span>
              <strong>{actor}</strong> đánh <strong style={{ color: '#f87171' }}>Attack</strong> —{' '}
              <strong>{target}</strong> phải đi {ev.turnsCount ?? 2} lượt!
            </span>
          ),
        };
      }

      case 'SKIP_RESOLVED': {
        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'self' : 'normal',
          tone: 'sapphire',
          actorAnchor: actorSeatAnchor,
          flights: !ev.wasAfterNopeWindow
            ? [
                {
                  imageSrc: getEKCardImg(ev.card),
                  aspectRatio: EK_ASPECT,
                  fromAnchors: getOriginAnchors(ev.actorId, myId, ev.card?.id),
                  toAnchors: ['ek-discard-pile'],
                  tone: 'sapphire',
                },
              ]
            : undefined,
          impacts: [{ anchors: ['ek-discard-pile'], tone: 'sapphire' }],
          message:
            (ev.turnsCount ?? 0) > 0 ? (
              <span>
                <strong>{actor}</strong> dùng <strong style={{ color: '#38bdf8' }}>Skip</strong> né 1
                lượt (còn {ev.turnsCount} lượt)
              </span>
            ) : (
              <span>
                <strong>{actor}</strong> dùng <strong style={{ color: '#38bdf8' }}>Skip</strong> bỏ
                lượt → tới <strong>{target}</strong>
              </span>
            ),
        };
      }

      case 'SHUFFLE_RESOLVED': {
        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'self' : 'normal',
          tone: 'gold',
          actorAnchor: actorSeatAnchor,
          flights: !ev.wasAfterNopeWindow
            ? [
                {
                  imageSrc: getEKCardImg(ev.card),
                  aspectRatio: EK_ASPECT,
                  fromAnchors: getOriginAnchors(ev.actorId, myId, ev.card?.id),
                  toAnchors: ['ek-discard-pile'],
                  tone: 'gold',
                },
              ]
            : undefined,
          impacts: [{ anchors: ['ek-draw-pile'], tone: 'gold', shake: true }],
          message: (
            <span>
              <strong>{actor}</strong> dùng <strong style={{ color: '#fde047' }}>Shuffle</strong>{' '}
              xáo trộn chồng bài rút!
            </span>
          ),
        };
      }

      case 'SEE_FUTURE_RESOLVED': {
        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'self' : 'normal',
          tone: 'emerald',
          actorAnchor: actorSeatAnchor,
          flights: !ev.wasAfterNopeWindow
            ? [
                {
                  imageSrc: getEKCardImg(ev.card),
                  aspectRatio: EK_ASPECT,
                  fromAnchors: getOriginAnchors(ev.actorId, myId, ev.card?.id),
                  toAnchors: ['ek-discard-pile'],
                  tone: 'emerald',
                },
              ]
            : undefined,
          impacts: [{ anchors: ['ek-draw-pile'], tone: 'emerald' }],
          message: (
            <span>
              <strong>{actor}</strong> dùng{' '}
              <strong style={{ color: '#34d399' }}>See the Future</strong> xem 3 lá đầu bộ bài
            </span>
          ),
        };
      }

      case 'FAVOR_REQUESTED':
      case 'FAVOR_EMPTY': {
        const priority: ActionFXPriority =
          ev.targetId === myId ? 'urgent-me' : ev.actorId === myId ? 'self' : 'normal';
        return {
          seq: ev.seq,
          priority,
          tone: 'amber',
          actorAnchor: actorSeatAnchor,
          flights: !ev.wasAfterNopeWindow
            ? [
                {
                  imageSrc: getEKCardImg(ev.card),
                  aspectRatio: EK_ASPECT,
                  fromAnchors: getOriginAnchors(ev.actorId, myId, ev.card?.id),
                  toAnchors: ['ek-discard-pile'],
                  tone: 'amber',
                },
              ]
            : undefined,
          impacts: ev.targetId
            ? [{ anchors: getTargetAnchors(ev.targetId, myId), tone: 'amber', shake: true }]
            : undefined,
          message:
            ev.type === 'FAVOR_EMPTY' ? (
              <span>
                <strong>{actor}</strong> dùng Favor nhưng <strong>{target}</strong> không còn bài
              </span>
            ) : (
              <span>
                <strong>{actor}</strong> dùng <strong style={{ color: '#fbbf24' }}>Favor</strong>{' '}
                yêu cầu <strong>{target}</strong> đưa 1 lá bài
              </span>
            ),
        };
      }

      case 'FAVOR_GIVEN': {
        const targetId = ev.targetId ?? ev.actorId;
        const priority: ActionFXPriority =
          targetId === myId ? 'urgent-me' : ev.actorId === myId ? 'self' : 'normal';
        const cardImg = ev.revealedCard ? getEKCardImg(ev.revealedCard) : EK_BACK_IMG;

        return {
          seq: ev.seq,
          priority,
          tone: 'gold',
          actorAnchor: actorSeatAnchor,
          flights: [
            {
              imageSrc: cardImg,
              aspectRatio: EK_ASPECT,
              fromAnchors: getOriginAnchors(ev.actorId, myId, ev.revealedCard?.id),
              toAnchors: getTargetAnchors(targetId, myId),
              tone: 'gold',
            },
          ],
          impacts: [{ anchors: getTargetAnchors(targetId, myId), tone: 'gold' }],
          message: ev.revealedCard ? (
            <span>
              <strong>{actor}</strong> đưa lá{' '}
              <strong style={{ color: '#fde047' }}>{ev.revealedCard.nameEn}</strong> cho{' '}
              <strong>{target}</strong>
            </span>
          ) : (
            <span>
              <strong>{actor}</strong> đã đưa 1 lá bài cho <strong>{target}</strong>
            </span>
          ),
        };
      }

      case 'COMBO_2_RESOLVED': {
        const priority: ActionFXPriority =
          ev.targetId === myId ? 'urgent-me' : ev.actorId === myId ? 'self' : 'normal';
        const flights: FlyingCardSpec[] = [];
        if (!ev.wasAfterNopeWindow) {
          flights.push({
            imageSrc: getEKCardImg(ev.card),
            aspectRatio: EK_ASPECT,
            fromAnchors: getOriginAnchors(ev.actorId, myId, ev.card?.id),
            toAnchors: ['ek-discard-pile'],
            tone: 'amber',
          });
        }
        if (ev.success && ev.targetId) {
          flights.push({
            imageSrc: ev.revealedCard ? getEKCardImg(ev.revealedCard) : EK_BACK_IMG,
            aspectRatio: EK_ASPECT,
            fromAnchors: getTargetAnchors(ev.targetId, myId),
            toAnchors: getTargetAnchors(ev.actorId, myId),
            tone: 'gold',
            delayMs: ev.wasAfterNopeWindow ? 0 : 240,
          });
        }

        return {
          seq: ev.seq,
          priority,
          tone: 'amber',
          actorAnchor: actorSeatAnchor,
          flights,
          impacts: ev.targetId
            ? [{ anchors: getTargetAnchors(ev.targetId, myId), tone: 'amber', shake: true }]
            : undefined,
          message: !ev.success ? (
            <span>
              <strong>{actor}</strong> đánh Combo 2 lá nhưng <strong>{target}</strong> hết bài
            </span>
          ) : ev.revealedCard ? (
            <span>
              <strong>{actor}</strong> đánh Combo 2 lá — rút được{' '}
              <strong style={{ color: '#fde047' }}>{ev.revealedCard.nameEn}</strong> từ{' '}
              <strong>{target}</strong>!
            </span>
          ) : (
            <span>
              <strong>{actor}</strong> đánh Combo 2 lá — rút mù 1 lá từ <strong>{target}</strong>!
            </span>
          ),
        };
      }

      case 'COMBO_3_RESOLVED': {
        const priority: ActionFXPriority =
          ev.targetId === myId ? 'urgent-me' : ev.actorId === myId ? 'self' : 'normal';
        const reqName = ev.requestedCardCode
          ? getCardCodeNameVi(ev.requestedCardCode)
          : 'lá chỉ định';
        const flights: FlyingCardSpec[] = [];
        if (!ev.wasAfterNopeWindow) {
          flights.push({
            imageSrc: getEKCardImg(ev.card),
            aspectRatio: EK_ASPECT,
            fromAnchors: getOriginAnchors(ev.actorId, myId, ev.card?.id),
            toAnchors: ['ek-discard-pile'],
            tone: 'amber',
          });
        }
        if (ev.success && ev.targetId) {
          flights.push({
            imageSrc: ev.revealedCard ? getEKCardImg(ev.revealedCard) : EK_BACK_IMG,
            aspectRatio: EK_ASPECT,
            fromAnchors: getTargetAnchors(ev.targetId, myId),
            toAnchors: getTargetAnchors(ev.actorId, myId),
            tone: 'gold',
            delayMs: ev.wasAfterNopeWindow ? 0 : 240,
          });
        }

        return {
          seq: ev.seq,
          priority,
          tone: 'amber',
          actorAnchor: actorSeatAnchor,
          flights,
          impacts: ev.targetId
            ? [{ anchors: getTargetAnchors(ev.targetId, myId), tone: 'amber', shake: true }]
            : undefined,
          message: ev.success ? (
            <span>
              <strong>{actor}</strong> ghép Combo 3 — lấy được{' '}
              <strong style={{ color: '#fde047' }}>{reqName}</strong> từ <strong>{target}</strong>!
            </span>
          ) : (
            <span>
              <strong>{actor}</strong> ghép Combo 3 xin <strong>{reqName}</strong> nhưng{' '}
              <strong>{target}</strong> không có!
            </span>
          ),
        };
      }

      case 'COMBO_5_PROMPT': {
        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'self' : 'normal',
          tone: 'gold',
          actorAnchor: actorSeatAnchor,
          flights: !ev.wasAfterNopeWindow
            ? [
                {
                  imageSrc: getEKCardImg(ev.card),
                  aspectRatio: EK_ASPECT,
                  fromAnchors: getOriginAnchors(ev.actorId, myId, ev.card?.id),
                  toAnchors: ['ek-discard-pile'],
                  tone: 'gold',
                },
              ]
            : undefined,
          message: ev.success ? (
            <span>
              <strong>{actor}</strong> ghép <strong style={{ color: '#fde047' }}>Combo 5 lá</strong>{' '}
              — đang chọn lá từ chồng bỏ
            </span>
          ) : (
            <span>
              <strong>{actor}</strong> ghép Combo 5 lá nhưng chồng bài bỏ trống
            </span>
          ),
        };
      }

      case 'DISCARD_PICKED': {
        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'self' : 'normal',
          tone: 'emerald',
          actorAnchor: actorSeatAnchor,
          flights: [
            {
              imageSrc: getEKCardImg(ev.card),
              aspectRatio: EK_ASPECT,
              fromAnchors: ['ek-discard-pile'],
              toAnchors: getTargetAnchors(ev.actorId, myId),
              tone: 'emerald',
            },
          ],
          impacts: [{ anchors: getTargetAnchors(ev.actorId, myId), tone: 'emerald' }],
          message: (
            <span>
              <strong>{actor}</strong> lấy lá{' '}
              <strong style={{ color: '#34d399' }}>{ev.card?.nameEn ?? 'bài bỏ'}</strong> từ chồng
              bài bỏ
            </span>
          ),
        };
      }

      case 'DRAW_SAFE': {
        return {
          seq: ev.seq,
          priority: 'silent',
          tone: 'emerald',
          flights: [
            {
              imageSrc: ev.revealedCard ? getEKCardImg(ev.revealedCard) : EK_BACK_IMG,
              aspectRatio: EK_ASPECT,
              fromAnchors: ['ek-draw-pile'],
              toAnchors: getTargetAnchors(ev.actorId, myId),
              tone: 'emerald',
              durationMs: 380,
            },
          ],
        };
      }

      case 'EXPLODING_DEFUSED': {
        const flights: FlyingCardSpec[] = [
          {
            imageSrc: getEKCardImg(ev.card),
            aspectRatio: EK_ASPECT,
            fromAnchors: ['ek-draw-pile'],
            toAnchors: getTargetAnchors(ev.actorId, myId),
            tone: 'ruby',
          },
        ];
        if (ev.secondaryCard) {
          flights.push({
            imageSrc: getEKCardImg(ev.secondaryCard),
            aspectRatio: EK_ASPECT,
            fromAnchors: getOriginAnchors(ev.actorId, myId, ev.secondaryCard.id),
            toAnchors: ['ek-discard-pile'],
            tone: 'emerald',
            delayMs: 260,
          });
        }

        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'urgent-me' : 'normal',
          tone: 'emerald',
          flights,
          impacts: [{ anchors: getTargetAnchors(ev.actorId, myId), tone: 'emerald', shake: true }],
          message: (
            <span>
              BÙM! <strong>{actor}</strong> bốc phải{' '}
              <strong style={{ color: '#f87171' }}>Mèo Nổ</strong> nhưng kịp dùng{' '}
              <strong style={{ color: '#34d399' }}>Defuse</strong> cứu mạng!
            </span>
          ),
        };
      }

      case 'PLAYER_EXPLODED': {
        return {
          seq: ev.seq,
          priority: 'urgent-me',
          tone: 'ruby',
          flights: [
            {
              imageSrc: getEKCardImg(ev.card),
              aspectRatio: EK_ASPECT,
              fromAnchors: ['ek-draw-pile'],
              toAnchors: getTargetAnchors(ev.actorId, myId),
              tone: 'ruby',
            },
          ],
          impacts: [{ anchors: getTargetAnchors(ev.actorId, myId), tone: 'ruby', shake: true }],
          message: (
            <span>
              💥 BÙM! <strong>{actor}</strong> bốc phải{' '}
              <strong style={{ color: '#f87171' }}>Mèo Nổ</strong> không có Defuse —{' '}
              <strong>BỊ LOẠI!</strong>
            </span>
          ),
        };
      }

      case 'KITTEN_INSERTED':
      default: {
        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'self' : 'normal',
          tone: 'amber',
          flights: [
            {
              imageSrc: EK_BACK_IMG,
              aspectRatio: EK_ASPECT,
              fromAnchors: getTargetAnchors(ev.actorId, myId),
              toAnchors: ['ek-draw-pile'],
              tone: 'amber',
            },
          ],
          impacts: [{ anchors: ['ek-draw-pile'], tone: 'amber', shake: true }],
          message: (
            <span>
              <strong>{actor}</strong> đã nhét lại{' '}
              <strong style={{ color: '#fbbf24' }}>Mèo Nổ</strong> vào bộ bài!
            </span>
          ),
        };
      }
    }
  });
}
