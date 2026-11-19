import {
  getCardInfoVi,
  getDisorderNameVi,
  getDrugNameVi,
  type SEEpisodePunishmentSummary,
  type SEGameEventView,
} from '@boardgame/game-side-effects';
import type { ActionFXItem, ActionFXPriority, FlyingCardSpec } from '../../app/actionFX/index.js';

const SE_FRONT_ASPECT = '520 / 864';
const SE_BACK_ASPECT = '496 / 822';
const SE_BACK_IMG = '/cards/back.jpg';

function getCardImage(cardId?: string): { src: string; aspectRatio: string } {
  if (!cardId) {
    return { src: SE_BACK_IMG, aspectRatio: SE_BACK_ASPECT };
  }
  const info = getCardInfoVi(cardId);
  return { src: info.imagePath || SE_BACK_IMG, aspectRatio: SE_FRONT_ASPECT };
}

function getPlayerOriginAnchors(
  playerId: string,
  myId: string,
  handInstanceId?: string,
): string[] {
  if (playerId === myId) {
    return handInstanceId
      ? [`se-hand-card-${handInstanceId}`, 'se-self-hand', 'se-self-psyche']
      : ['se-self-hand', 'se-self-psyche'];
  }
  return [`se-seat-${playerId}`];
}

function getDisorderTargetAnchors(
  targetId: string,
  myId: string,
  disorderInstanceId?: string,
): string[] {
  if (targetId === myId) {
    return disorderInstanceId
      ? [`se-self-slot-${disorderInstanceId}`, 'se-self-psyche']
      : ['se-self-psyche'];
  }
  return disorderInstanceId
    ? [
        `se-opp-disorder-${disorderInstanceId}`,
        `se-opp-disorder-text-${disorderInstanceId}`,
        `se-seat-${targetId}`,
      ]
    : [`se-seat-${targetId}`];
}

function formatPunishmentSuffix(
  summary: SEEpisodePunishmentSummary | undefined,
  count: number | undefined,
  revealedCardIds: string[] | undefined,
): string {
  switch (summary) {
    case 'ANXIETY_PENDING':
      return ' → xem bài & chọn lấy 1 lá';
    case 'ANXIETY_EMPTY_HAND':
    case 'GAMBLING_EMPTY_HAND':
      return ' → tay rỗng nên không mất bài';
    case 'TREMORS_PENDING':
      return ' → phải bỏ 3 lá trong 7s!';
    case 'TREMORS_AUTO_DISCARD_HAND':
      return ` → mất sạch ${count ?? 0} lá trên tay!`;
    case 'GAMBLING_STEAL': {
      if (revealedCardIds && revealedCardIds.length > 0) {
        const names = revealedCardIds.map((id) => getCardInfoVi(id).nameVi).join(', ');
        return ` → lấy ${count ?? revealedCardIds.length} lá (${names})`;
      }
      return ` → lấy ngẫu nhiên ${count ?? 0} lá`;
    }
    case 'SUICIDAL_DISCARD_HAND':
      return ` → bỏ toàn bộ ${count ?? 0} lá trên tay!`;
    case 'MADNESS_DISCARD_DRUGS':
      return count && count > 0
        ? ` → gỡ ${count} Thuốc trên Thể Trạng!`
        : ' → không có Thuốc nào để gỡ';
    case 'SKIP_TURN_APPLIED':
      return ' → mất lượt kế tiếp!';
    case 'PREVENT_PLAY_APPLIED':
      return ' → cấm đánh bài lượt tới!';
    case 'PREVENT_DRAW_APPLIED':
      return ' → mất rút bài lượt tới!';
    case 'ALREADY_INFLICTED':
      return ' → đã dính trong lượt này';
    default:
      return '';
  }
}

export function mapSideEffectsEventsToFX(
  events: SEGameEventView[] | undefined,
  myId: string,
  playerNames: Record<string, string>,
): ActionFXItem[] {
  if (!events || events.length === 0) return [];

  const nameOf = (id?: string): string => {
    if (!id) return '';
    if (id === myId) return 'Bạn';
    return playerNames[id] || id;
  };

  return events.map((ev): ActionFXItem => {
    const actor = nameOf(ev.actorId);
    const target = nameOf(ev.targetId);
    const actorSeatAnchor = ev.actorId !== myId ? `se-seat-${ev.actorId}` : undefined;

    switch (ev.type) {
      case 'TREAT': {
        const drugImg = getCardImage(ev.cardId);
        const drugName = ev.cardId ? getDrugNameVi(ev.cardId) : 'Thuốc';
        const disorderName = ev.disorderCardId ? getDisorderNameVi(ev.disorderCardId) : 'Bệnh Lý';
        const targetAnchors = getDisorderTargetAnchors(ev.actorId, myId, ev.disorderInstanceId);

        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'self' : 'normal',
          tone: 'sapphire',
          actorAnchor: actorSeatAnchor,
          flights: [
            {
              imageSrc: drugImg.src,
              aspectRatio: drugImg.aspectRatio,
              fromAnchors: getPlayerOriginAnchors(ev.actorId, myId, ev.actorHandInstanceId),
              toAnchors: targetAnchors,
              tone: 'sapphire',
            },
          ],
          impacts: [{ anchors: targetAnchors, tone: 'sapphire' }],
          message: (
            <span>
              <strong>{actor}</strong> dùng <strong style={{ color: '#38bdf8' }}>{drugName}</strong>{' '}
              trị <strong>{disorderName}</strong>
            </span>
          ),
        };
      }

      case 'THERAPY': {
        const therapyImg = getCardImage(ev.cardId ?? 'therapy');
        const disorderName = ev.disorderCardId ? getDisorderNameVi(ev.disorderCardId) : 'Bệnh Lý';
        const slotAnchors = getDisorderTargetAnchors(ev.actorId, myId, ev.disorderInstanceId);

        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'self' : 'normal',
          tone: 'emerald',
          actorAnchor: actorSeatAnchor,
          flights: [
            {
              imageSrc: therapyImg.src,
              aspectRatio: therapyImg.aspectRatio,
              fromAnchors: getPlayerOriginAnchors(ev.actorId, myId, ev.actorHandInstanceId),
              toAnchors: slotAnchors,
              tone: 'emerald',
            },
          ],
          impacts: [
            {
              anchors: ev.actorId === myId ? ['se-self-psyche'] : [`se-seat-${ev.actorId}`],
              tone: 'emerald',
            },
          ],
          message: (
            <span>
              <strong>{actor}</strong> dùng <strong style={{ color: '#34d399' }}>Liệu Pháp</strong>{' '}
              loại bỏ <strong>{disorderName}</strong>
            </span>
          ),
        };
      }

      case 'GIVE_DISORDER': {
        const targetId = ev.targetId ?? ev.actorId;
        const disorderImg = getCardImage(ev.cardId);
        const disorderName = ev.disorderCardId
          ? getDisorderNameVi(ev.disorderCardId)
          : 'Bệnh Lý';
        const targetAnchors = getDisorderTargetAnchors(targetId, myId, ev.disorderInstanceId);
        const priority: ActionFXPriority =
          targetId === myId ? 'urgent-me' : ev.actorId === myId ? 'self' : 'normal';

        return {
          seq: ev.seq,
          priority,
          tone: 'ruby',
          actorAnchor: actorSeatAnchor,
          flights: [
            {
              imageSrc: disorderImg.src,
              aspectRatio: disorderImg.aspectRatio,
              fromAnchors: getPlayerOriginAnchors(ev.actorId, myId, ev.actorHandInstanceId),
              toAnchors: targetAnchors,
              tone: 'ruby',
            },
          ],
          impacts: [{ anchors: targetAnchors, tone: 'ruby', shake: true }],
          message: (
            <span>
              <strong>{actor}</strong> đưa Bệnh Lý{' '}
              <strong style={{ color: '#fda4af' }}>{disorderName}</strong> vào{' '}
              <strong>{target}</strong>
            </span>
          ),
        };
      }

      case 'EPISODE': {
        const targetId = ev.targetId ?? ev.actorId;
        const episodeImg = getCardImage(ev.cardId ?? 'episode');
        const disorderName = ev.disorderCardId
          ? getDisorderNameVi(ev.disorderCardId)
          : 'Bệnh Lý';
        const targetAnchors = getDisorderTargetAnchors(targetId, myId, ev.disorderInstanceId);
        const priority: ActionFXPriority =
          targetId === myId ? 'urgent-me' : ev.actorId === myId ? 'self' : 'normal';

        const flights: FlyingCardSpec[] = [
          {
            imageSrc: episodeImg.src,
            aspectRatio: episodeImg.aspectRatio,
            fromAnchors: getPlayerOriginAnchors(ev.actorId, myId, ev.actorHandInstanceId),
            toAnchors: targetAnchors,
            tone: 'amber',
          },
        ];

        if (ev.punishmentSummary === 'GAMBLING_STEAL' && (ev.count ?? 0) > 0) {
          const stolenImg = ev.revealedCardIds?.[0]
            ? getCardImage(ev.revealedCardIds[0])
            : { src: SE_BACK_IMG, aspectRatio: SE_BACK_ASPECT };
          flights.push({
            imageSrc: stolenImg.src,
            aspectRatio: stolenImg.aspectRatio,
            fromAnchors: getPlayerOriginAnchors(targetId, myId),
            toAnchors: getPlayerOriginAnchors(ev.actorId, myId),
            tone: 'gold',
            delayMs: 260,
          });
        } else if (ev.punishmentSummary === 'MADNESS_DISCARD_DRUGS' && (ev.count ?? 0) > 0) {
          flights.push({
            imageSrc: SE_BACK_IMG,
            aspectRatio: SE_BACK_ASPECT,
            fromAnchors: getDisorderTargetAnchors(targetId, myId),
            toAnchors: ['se-discard-pile'],
            tone: 'ruby',
            delayMs: 260,
          });
        } else if (
          (ev.punishmentSummary === 'SUICIDAL_DISCARD_HAND' ||
            ev.punishmentSummary === 'TREMORS_AUTO_DISCARD_HAND') &&
          (ev.count ?? 0) > 0
        ) {
          flights.push({
            imageSrc: SE_BACK_IMG,
            aspectRatio: SE_BACK_ASPECT,
            fromAnchors: getPlayerOriginAnchors(targetId, myId),
            toAnchors: ['se-discard-pile'],
            tone: 'ruby',
            delayMs: 260,
          });
        }

        const suffix = formatPunishmentSuffix(ev.punishmentSummary, ev.count, ev.revealedCardIds);

        return {
          seq: ev.seq,
          priority,
          tone: 'amber',
          actorAnchor: actorSeatAnchor,
          flights,
          impacts: [{ anchors: targetAnchors, tone: 'amber', shake: true }],
          message: (
            <span>
              <strong>{actor}</strong> kích hoạt{' '}
              <strong style={{ color: '#fbbf24' }}>{disorderName}</strong> của{' '}
              <strong>{target}</strong>
              {suffix}
            </span>
          ),
        };
      }

      case 'ANXIETY_STEAL': {
        const targetId = ev.targetId ?? ev.actorId;
        const stolenCardId = ev.revealedCardIds?.[0];
        const stolenImg = stolenCardId
          ? getCardImage(stolenCardId)
          : { src: SE_BACK_IMG, aspectRatio: SE_BACK_ASPECT };
        const stolenName = stolenCardId ? getCardInfoVi(stolenCardId).nameVi : null;
        const priority: ActionFXPriority =
          targetId === myId ? 'urgent-me' : ev.actorId === myId ? 'self' : 'normal';

        return {
          seq: ev.seq,
          priority,
          tone: 'amber',
          actorAnchor: actorSeatAnchor,
          flights: [
            {
              imageSrc: stolenImg.src,
              aspectRatio: stolenImg.aspectRatio,
              fromAnchors: getPlayerOriginAnchors(targetId, myId),
              toAnchors: getPlayerOriginAnchors(ev.actorId, myId),
              tone: 'gold',
            },
          ],
          impacts: [{ anchors: getPlayerOriginAnchors(targetId, myId), tone: 'amber', shake: true }],
          message: stolenName ? (
            <span>
              <strong>{actor}</strong> lấy lá{' '}
              <strong style={{ color: '#fde047' }}>{stolenName}</strong> từ tay{' '}
              <strong>{target}</strong>
            </span>
          ) : (
            <span>
              <strong>{actor}</strong> lấy 1 lá bài từ tay <strong>{target}</strong> (Lo âu)
            </span>
          ),
        };
      }

      case 'TREMORS_DISCARD': {
        const topImg = getCardImage(ev.cardId);
        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'self' : 'normal',
          tone: 'amber',
          actorAnchor: actorSeatAnchor,
          flights: [
            {
              imageSrc: topImg.src,
              aspectRatio: topImg.aspectRatio,
              fromAnchors: getPlayerOriginAnchors(ev.actorId, myId),
              toAnchors: ['se-discard-pile'],
              tone: 'amber',
            },
          ],
          message: (
            <span>
              <strong>{actor}</strong> đã bỏ {ev.count ?? 3} lá bài do <strong>Chứng run</strong>
            </span>
          ),
        };
      }

      case 'TREMORS_TIMEOUT': {
        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'urgent-me' : 'normal',
          tone: 'ruby',
          flights:
            (ev.count ?? 0) > 0
              ? [
                  {
                    imageSrc: SE_BACK_IMG,
                    aspectRatio: SE_BACK_ASPECT,
                    fromAnchors: getPlayerOriginAnchors(ev.actorId, myId),
                    toAnchors: ['se-discard-pile'],
                    tone: 'ruby',
                  },
                ]
              : undefined,
          impacts: [{ anchors: getPlayerOriginAnchors(ev.actorId, myId), tone: 'ruby', shake: true }],
          message: (
            <span>
              Hết giờ! <strong>{actor}</strong> mất toàn bộ bài trên tay do{' '}
              <strong style={{ color: '#f87171' }}>Chứng run</strong>
            </span>
          ),
        };
      }

      case 'SKIP_TURN': {
        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'urgent-me' : 'normal',
          tone: 'ruby',
          impacts: [
            {
              anchors: ev.actorId === myId ? ['se-self-psyche'] : [`se-seat-${ev.actorId}`],
              tone: 'ruby',
              shake: true,
            },
          ],
          message: (
            <span>
              <strong>{actor}</strong> bị <strong style={{ color: '#f87171' }}>Trầm cảm</strong> —
              mất lượt này!
            </span>
          ),
        };
      }

      case 'TURN_RESTRICTION': {
        const isImpotence = ev.disorderCardId === 'impotence';
        return {
          seq: ev.seq,
          priority: ev.actorId === myId ? 'urgent-me' : 'normal',
          tone: 'amber',
          impacts: [
            {
              anchors: ev.actorId === myId ? ['se-self-psyche'] : [`se-seat-${ev.actorId}`],
              tone: 'amber',
              shake: true,
            },
          ],
          message: isImpotence ? (
            <span>
              <strong>{actor}</strong> bị <strong style={{ color: '#fbbf24' }}>Liệt dương</strong> —
              không thể đánh bài lượt này
            </span>
          ) : (
            <span>
              <strong>{actor}</strong> bị{' '}
              <strong style={{ color: '#fbbf24' }}>Chứng biếng ăn</strong> — mất rút bài đầu lượt
            </span>
          ),
        };
      }

      case 'DRAW_TURN': {
        return {
          seq: ev.seq,
          priority: 'silent',
          tone: 'gold',
          flights: [
            {
              imageSrc: SE_BACK_IMG,
              aspectRatio: SE_BACK_ASPECT,
              fromAnchors: ['se-draw-pile'],
              toAnchors: getPlayerOriginAnchors(ev.actorId, myId),
              tone: 'gold',
              durationMs: 380,
            },
          ],
        };
      }

      case 'DISCARD': {
        const discardImg = getCardImage(ev.cardId);
        return {
          seq: ev.seq,
          priority: 'silent',
          tone: 'slate',
          flights: [
            {
              imageSrc: discardImg.src,
              aspectRatio: discardImg.aspectRatio,
              fromAnchors: getPlayerOriginAnchors(ev.actorId, myId),
              toAnchors: ['se-discard-pile'],
              tone: 'slate',
              durationMs: 380,
            },
          ],
        };
      }

      case 'TRADE_PROPOSED': {
        const isParticipant = ev.actorId === myId || ev.targetId === myId;
        // Participants already see the interactive trade-notice card
        return {
          seq: ev.seq,
          priority: isParticipant ? 'silent' : 'normal',
          tone: 'gold',
          actorAnchor: actorSeatAnchor,
          message: isParticipant ? undefined : (
            <span>
              <strong>{actor}</strong> mời <strong>{target}</strong> đổi bài ({ev.count ?? 1} lá)
            </span>
          ),
        };
      }

      case 'TRADE_COMPLETED': {
        const targetId = ev.targetId ?? ev.actorId;
        const isParticipant = ev.actorId === myId || targetId === myId;
        const offerImg = ev.revealedCardIds?.[0]
          ? getCardImage(ev.revealedCardIds[0])
          : { src: SE_BACK_IMG, aspectRatio: SE_BACK_ASPECT };
        const giveImg = ev.revealedSecondaryCardIds?.[0]
          ? getCardImage(ev.revealedSecondaryCardIds[0])
          : { src: SE_BACK_IMG, aspectRatio: SE_BACK_ASPECT };

        const flights: FlyingCardSpec[] = [];
        if ((ev.count ?? 0) > 0) {
          flights.push({
            imageSrc: offerImg.src,
            aspectRatio: offerImg.aspectRatio,
            fromAnchors: getPlayerOriginAnchors(ev.actorId, myId),
            toAnchors: getPlayerOriginAnchors(targetId, myId),
            tone: 'gold',
          });
        }
        if ((ev.secondaryCount ?? 0) > 0) {
          flights.push({
            imageSrc: giveImg.src,
            aspectRatio: giveImg.aspectRatio,
            fromAnchors: getPlayerOriginAnchors(targetId, myId),
            toAnchors: getPlayerOriginAnchors(ev.actorId, myId),
            tone: 'emerald',
            delayMs: 140,
          });
        }

        // Participants already see trade-result-banner; observers see this banner + everyone sees the swap flight!
        return {
          seq: ev.seq,
          priority: isParticipant ? 'silent' : 'normal',
          tone: 'gold',
          flights,
          message: isParticipant ? undefined : (
            <span>
              <strong>{actor}</strong> và <strong>{target}</strong> đã hoàn tất đổi bài
            </span>
          ),
        };
      }

      case 'TRADE_RESPONDED':
      case 'TRADE_REJECTED':
      case 'TRADE_CANCELLED':
      default:
        return {
          seq: ev.seq,
          priority: 'silent',
          tone: 'slate',
        };
    }
  });
}
