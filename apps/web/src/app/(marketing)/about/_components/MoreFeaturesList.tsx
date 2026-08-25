'use client';

import { useEffect, useRef, useState } from 'react';

import { CheckIcon } from '../../_components/primitives';
import { useReveal } from './Reveal';

const SPEED_PX_PER_SEC = 11;

const FADE_MASK =
  'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)';

/** 카드 3 — 카드로 세우지 않은 기능들이 위로 천천히 흘러가는 목록. */
export default function MoreFeaturesList({ items }: { items: string[] }) {
  const { playing, reducedMotion } = useReveal();
  const trackRef = useRef<HTMLUListElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!playing || reducedMotion) {
      return;
    }

    let frame = 0;
    let previous: number | null = null;

    const step = (now: number) => {
      const elapsed = previous === null ? 0 : now - previous;
      previous = now;

      const loopHeight = (trackRef.current?.scrollHeight ?? 0) / 2;

      setOffset((current) => {
        const next = current + (elapsed / 1000) * SPEED_PX_PER_SEC;

        return loopHeight > 0 && next >= loopHeight ? next - loopHeight : next;
      });

      frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(frame);
  }, [playing, reducedMotion]);

  // 행 높이가 없는 lg 미만에서는 목록 전체(순환용 복제분까지)만큼 타일이 늘어나므로
  // 높이를 묶어 다른 타일과 비슷한 크기로 맞춘다.
  return (
    <div
      className="relative mt-4 max-h-44 min-h-0 flex-1 overflow-hidden lg:max-h-none"
      style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
    >
      <ul
        ref={trackRef}
        className="flex flex-col gap-3 will-change-transform"
        style={{ transform: `translateY(${-offset}px)` }}
      >
        {[...items, ...items].map((item, index) => (
          <li
            key={`${item}-${index}`}
            aria-hidden={index >= items.length}
            className="flex items-start gap-2 text-base leading-snug text-foreground"
          >
            <CheckIcon className="mt-1 size-3.5 shrink-0 text-primary" />
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
