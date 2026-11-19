import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ActionFXItem, ActionFXPriority, ActionFXTone, FlyingCardSpec } from './types.js';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface AnchorRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ActiveFlight {
  id: string;
  imageSrc: string;
  aspectRatio: string;
  tone: ActionFXTone;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delayMs: number;
  durationMs: number;
}

interface QueuedBanner {
  id: string;
  seq: number;
  priority: Exclude<ActionFXPriority, 'silent'>;
  tone: ActionFXTone;
  message: React.ReactNode;
}

const TONE_COLORS: Record<
  ActionFXTone,
  { dot: string; border: string; urgentBorder: string; glow: string }
> = {
  emerald: {
    dot: '#10b981',
    border: 'rgba(16, 185, 129, 0.5)',
    urgentBorder: '#34d399',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  sapphire: {
    dot: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.5)',
    urgentBorder: '#7dd3fc',
    glow: 'rgba(56, 189, 248, 0.4)',
  },
  amber: {
    dot: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.55)',
    urgentBorder: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.45)',
  },
  ruby: {
    dot: '#ef4444',
    border: 'rgba(239, 68, 68, 0.55)',
    urgentBorder: '#f87171',
    glow: 'rgba(239, 68, 68, 0.5)',
  },
  gold: {
    dot: '#facc15',
    border: 'rgba(234, 179, 8, 0.5)',
    urgentBorder: '#fde047',
    glow: 'rgba(234, 179, 8, 0.4)',
  },
  slate: {
    dot: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.4)',
    urgentBorder: '#cbd5e1',
    glow: 'rgba(148, 163, 184, 0.25)',
  },
};

function getDurationByPriority(priority: Exclude<ActionFXPriority, 'silent'>): number {
  switch (priority) {
    case 'self':
      return 1500;
    case 'urgent-me':
      return 4500;
    case 'normal':
    default:
      return 2500;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const FlyingCardGhost: React.FC<{
  flight: ActiveFlight;
  cardWidth: number;
  onDone: (id: string) => void;
}> = ({ flight, cardWidth, onDone }) => {
  const elRef = useRef<HTMLDivElement | null>(null);
  const palette = TONE_COLORS[flight.tone];

  useEffect(() => {
    const el = elRef.current;
    const totalMs = flight.delayMs + flight.durationMs;
    const fallbackTimer = setTimeout(() => {
      onDone(flight.id);
    }, totalMs + 60);

    if (el && typeof el.animate === 'function') {
      const dx = flight.toX - flight.fromX;
      const dy = flight.toY - flight.fromY;
      const midX = dx * 0.48;
      const midY = dy * 0.48 - 18;

      try {
        el.animate(
          [
            {
              transform: 'translate3d(-50%, -50%, 0) scale(0.86) rotate(-5deg)',
              opacity: 0.95,
              offset: 0,
            },
            {
              transform: `translate3d(calc(-50% + ${Math.round(midX)}px), calc(-50% + ${Math.round(midY)}px), 0) scale(1.08) rotate(2deg)`,
              opacity: 1,
              offset: 0.45,
            },
            {
              transform: `translate3d(calc(-50% + ${Math.round(dx)}px), calc(-50% + ${Math.round(dy)}px), 0) scale(0.82) rotate(0deg)`,
              opacity: 0.12,
              offset: 1,
            },
          ],
          {
            duration: flight.durationMs,
            delay: flight.delayMs,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards',
          },
        );
      } catch {
        // Fallback timer still cleans up cleanly
      }
    }

    return () => clearTimeout(fallbackTimer);
  }, [flight, onDone]);

  return (
    <div
      ref={elRef}
      data-testid="action-fx-flying-card"
      style={{
        position: 'fixed',
        left: `${Math.round(flight.fromX)}px`,
        top: `${Math.round(flight.fromY)}px`,
        width: `${cardWidth}px`,
        aspectRatio: flight.aspectRatio,
        transform: 'translate3d(-50%, -50%, 0)',
        opacity: flight.delayMs > 0 ? 0 : 0.95,
        borderRadius: '5px',
        border: `1.5px solid ${palette.urgentBorder}`,
        boxShadow: `0 10px 24px rgba(0, 0, 0, 0.8), 0 0 16px ${palette.glow}`,
        backgroundColor: '#071712',
        backgroundImage: `url("${flight.imageSrc}")`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
        zIndex: 850,
        overflow: 'hidden',
        willChange: 'transform, opacity',
      }}
    />
  );
};

export interface ActionFXOverlayProps {
  items: ActionFXItem[];
  isLandscape?: boolean;
  /** Left offset percentage on landscape (e.g. 42 for Side Effects right column, 0 for centered) */
  landscapeLeftPercent?: number;
  /** Top offset in px from top of viewport */
  topOffsetPx?: number;
  /** Notifies parent whether a notification pill is currently visible */
  onActiveBannerChange?: (visible: boolean) => void;
}

export const ActionFXOverlay: React.FC<ActionFXOverlayProps> = ({
  items,
  isLandscape = false,
  landscapeLeftPercent = 0,
  topOffsetPx = 38,
  onActiveBannerChange,
}) => {
  const anchorCacheRef = useRef<Map<string, AnchorRect>>(new Map());
  const lastSeenSeqRef = useRef<number | null>(null);
  const impactTimersRef = useRef<NodeJS.Timeout[]>([]);

  const [flights, setFlights] = useState<ActiveFlight[]>([]);
  const [bannerQueue, setBannerQueue] = useState<QueuedBanner[]>([]);

  const activeBanner = bannerQueue[0] ?? null;

  useEffect(() => {
    onActiveBannerChange?.(Boolean(activeBanner));
  }, [activeBanner, onActiveBannerChange]);

  // Cache live anchor coordinates after every render so removed cards/slots still have valid origins/targets
  useIsomorphicLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    const nodes = document.querySelectorAll<HTMLElement>('[data-fx-anchor]');
    for (const node of nodes) {
      const key = node.getAttribute('data-fx-anchor');
      if (!key) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        anchorCacheRef.current.set(key, {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    }
  });

  // Cleanup DOM impact attributes & timers on unmount
  useEffect(() => {
    const timers = impactTimersRef.current;
    return () => {
      for (const t of timers) {
        clearTimeout(t);
      }
    };
  }, []);

  const resolveAnchorCenter = (anchors: string[]): { x: number; y: number } => {
    if (typeof document !== 'undefined') {
      for (const key of anchors) {
        if (!key) continue;
        const live = document.querySelector<HTMLElement>(`[data-fx-anchor="${CSS.escape(key)}"]`);
        if (live) {
          const r = live.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }
        }
        const cached = anchorCacheRef.current.get(key);
        if (cached && cached.width > 0 && cached.height > 0) {
          return { x: cached.left + cached.width / 2, y: cached.top + cached.height / 2 };
        }
      }
    }

    const w = typeof window !== 'undefined' ? window.innerWidth : 375;
    const h = typeof window !== 'undefined' ? window.innerHeight : 667;
    return { x: w / 2, y: h * 0.45 };
  };

  // Detect and dispatch newly arrived events
  useEffect(() => {
    const maxSeq = items.reduce((acc, it) => (it.seq > acc ? it.seq : acc), 0);

    // First mount / reconnect: skip historical events
    if (lastSeenSeqRef.current === null) {
      lastSeenSeqRef.current = maxSeq;
      return;
    }

    const fresh = items.filter((it) => it.seq > lastSeenSeqRef.current!);
    if (fresh.length === 0) return;

    lastSeenSeqRef.current = maxSeq;
    const reducedMotion = prefersReducedMotion();

    // Anti-backlog: only animate the latest 2 items if many arrived at once
    const recentVisualItems = fresh.slice(-2);

    // 1. Trigger DOM actor pulse & target hit highlights
    if (typeof document !== 'undefined') {
      for (const item of recentVisualItems) {
        if (item.actorAnchor) {
          const actorEl = document.querySelector<HTMLElement>(
            `[data-fx-anchor="${CSS.escape(item.actorAnchor)}"]`,
          );
          if (actorEl) {
            actorEl.setAttribute('data-fx-actor', 'active');
            const t = setTimeout(() => {
              actorEl.removeAttribute('data-fx-actor');
            }, 600);
            impactTimersRef.current.push(t);
          }
        }

        if (item.impacts) {
          for (const imp of item.impacts) {
            const startDelay = imp.delayMs ?? (reducedMotion ? 0 : 280);
            const tStart = setTimeout(() => {
              for (const key of imp.anchors) {
                if (!key) continue;
                const targetEl = document.querySelector<HTMLElement>(
                  `[data-fx-anchor="${CSS.escape(key)}"]`,
                );
                if (targetEl) {
                  const attrVal =
                    imp.shake && !reducedMotion ? `${imp.tone}-shake` : imp.tone;
                  targetEl.setAttribute('data-fx-hit', attrVal);
                  const tEnd = setTimeout(() => {
                    if (targetEl.getAttribute('data-fx-hit') === attrVal) {
                      targetEl.removeAttribute('data-fx-hit');
                    }
                  }, 750);
                  impactTimersRef.current.push(tEnd);
                  break;
                }
              }
            }, startDelay);
            impactTimersRef.current.push(tStart);
          }
        }
      }
    }

    // 2. Spawn flying cards (skipped when prefers-reduced-motion is enabled)
    if (!reducedMotion) {
      const spawned: ActiveFlight[] = [];
      recentVisualItems.forEach((item, itemIdx) => {
        if (!item.flights || item.flights.length === 0) return;
        item.flights.forEach((f: FlyingCardSpec, fIdx: number) => {
          const from = resolveAnchorCenter(f.fromAnchors);
          const to = resolveAnchorCenter(f.toAnchors);
          // Skip degenerate zero-distance flight
          if (Math.hypot(to.x - from.x, to.y - from.y) < 8) return;

          spawned.push({
            id: `fx_${item.seq}_${fIdx}_${Date.now()}`,
            imageSrc: f.imageSrc,
            aspectRatio: f.aspectRatio,
            tone: f.tone ?? item.tone,
            fromX: from.x,
            fromY: from.y,
            toX: to.x,
            toY: to.y,
            delayMs: (f.delayMs ?? 0) + itemIdx * 180,
            durationMs: f.durationMs ?? 440,
          });
        });
      });

      if (spawned.length > 0) {
        setFlights((prev) => [...prev.slice(-3), ...spawned]);
      }
    }

    // 3. Enqueue notification banners (skip 'silent' background actions)
    const incomingBanners: QueuedBanner[] = fresh
      .filter((it): it is ActionFXItem & { priority: Exclude<ActionFXPriority, 'silent'> } => {
        return it.priority !== 'silent' && Boolean(it.message);
      })
      .map((it) => ({
        id: `banner_${it.seq}`,
        seq: it.seq,
        priority: it.priority,
        tone: it.tone,
        message: it.message!,
      }));

    if (incomingBanners.length > 0) {
      setBannerQueue((prev) => {
        const combined = [...prev, ...incomingBanners];
        // Anti-backlog cap: if > 3 queued, keep currently active + latest 2 (preserving urgent-me if within last 3)
        if (combined.length <= 3) return combined;
        return [combined[0]!, ...combined.slice(-2)];
      });
    }
  }, [items]);

  // Advance banner queue timer
  useEffect(() => {
    if (!activeBanner) return;
    const duration = getDurationByPriority(activeBanner.priority);
    const timer = setTimeout(() => {
      setBannerQueue((prev) => prev.slice(1));
    }, duration);
    return () => clearTimeout(timer);
  }, [activeBanner]);

  const handleFlightDone = (id: string) => {
    setFlights((prev) => prev.filter((f) => f.id !== id));
  };

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
  const flyingCardWidth = viewportWidth >= 1024 ? 68 : isLandscape ? 46 : 54;

  const activePalette = activeBanner ? TONE_COLORS[activeBanner.tone] : null;
  const isUrgent = activeBanner?.priority === 'urgent-me';

  return (
    <>
      {flights.map((f) => (
        <FlyingCardGhost
          key={f.id}
          flight={f}
          cardWidth={flyingCardWidth}
          onDone={handleFlightDone}
        />
      ))}

      {activeBanner && activePalette && (
        <div
          key={activeBanner.id}
          data-testid="action-fx-banner"
          data-priority={activeBanner.priority}
          role="status"
          aria-live="polite"
          className="action-fx-banner"
          style={{
            position: 'fixed',
            top: `max(${topOffsetPx}px, env(safe-area-inset-top))`,
            left: isLandscape && landscapeLeftPercent > 0 ? `${landscapeLeftPercent}%` : '8px',
            right: '8px',
            maxWidth: isLandscape ? '460px' : '440px',
            margin: '0 auto',
            zIndex: 860,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isUrgent ? '7px 13px' : '5px 11px',
            borderRadius: '12px',
            background: isUrgent
              ? 'linear-gradient(135deg, rgba(24, 14, 18, 0.96) 0%, rgba(12, 26, 20, 0.97) 100%)'
              : 'linear-gradient(135deg, rgba(14, 34, 27, 0.95) 0%, rgba(8, 20, 16, 0.96) 100%)',
            border: isUrgent
              ? `1.5px solid ${activePalette.urgentBorder}`
              : `1px solid ${activePalette.border}`,
            boxShadow: isUrgent
              ? `0 10px 28px rgba(0, 0, 0, 0.85), 0 0 20px ${activePalette.glow}`
              : '0 6px 20px rgba(0, 0, 0, 0.72)',
            color: '#f8fafc',
            fontSize: '12px',
            fontWeight: isUrgent ? 700 : 600,
            lineHeight: 1.3,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxSizing: 'border-box',
          }}
        >
          <span
            style={{
              width: isUrgent ? '8px' : '7px',
              height: isUrgent ? '8px' : '7px',
              borderRadius: '50%',
              backgroundColor: activePalette.dot,
              boxShadow: `0 0 8px ${activePalette.dot}`,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0, wordBreak: 'normal' }}>
            {activeBanner.message}
          </div>
          {bannerQueue.length > 1 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#cbd5e1',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '1px 5px',
                borderRadius: '999px',
                flexShrink: 0,
              }}
            >
              +{bannerQueue.length - 1}
            </span>
          )}
        </div>
      )}
    </>
  );
};
