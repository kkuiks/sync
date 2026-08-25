'use client';

import { useEffect, useState } from 'react';

import { CheckIcon, ResolvedPill, TypeTag } from '../../_components/primitives';
import { useReveal } from './Reveal';

const DWELL_MS = 3200;

const PUSH_MS = 620;

const FADE_MS = 1100;

const BOUNCE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

const EXIT_EASE = 'cubic-bezier(0.5, 0, 1, 1)';

const EXIT_DROP = 115;

const QUEUE_DEPTH = 0.4;

const CARD_HEIGHT = 86;

const CARD_WIDTH = 76;

const CARD_INSET_Y = 2;

const OFFSET_PERCENT = 7;

const SCALE_STEP = 0.045;

const QUEUED = -2;

const EJECTED = -1;

interface CardInstance {
  id: number;
  slide: number;
  slot: number;
  /** 이 카드가 보여줄 예시 묶음. 카드가 안 보이는 동안에만 바뀐다. */
  variant: number;
}

interface CarouselState {
  cards: CardInstance[];
  /** 다음에 대기열로 돌아가는 카드가 물려받을 묶음. */
  nextVariant: number;
}

/**
 * 밀려난 카드는 화면 밖에서 대기열로 돌아가며, 그때 다음 분야의 예시를 물려받는다.
 * 묶음을 카드마다 세는 대신 여기서 한 줄로 돌려야 앞으로 나오는 순서가 어긋나지 않는다.
 */
function settleExit(state: CarouselState, variantCount: number): CarouselState {
  if (!state.cards.some((card) => card.slot === EJECTED)) {
    return state;
  }

  const front = state.cards.find((card) => card.slot === 0);

  return {
    cards: state.cards.map((card) =>
      card.slot === EJECTED
        ? {
            ...card,
            slot: QUEUED,
            slide: front?.slide ?? card.slide,
            variant: state.nextVariant,
          }
        : card,
    ),
    nextVariant: (state.nextVariant + 1) % variantCount,
  };
}

function advance(
  state: CarouselState,
  count: number,
  variantCount: number,
): CarouselState {
  const settled = settleExit(state, variantCount);

  return {
    ...settled,
    cards: settled.cards.map((card) => {
      if (card.slot === QUEUED) {
        return { ...card, slot: count - 1 };
      }

      return card.slot >= 0 ? { ...card, slot: card.slot - 1 } : card;
    }),
  };
}

function stackCenter(count: number) {
  return (-(count - 1) * OFFSET_PERCENT) / 2;
}

function slotTransform(slot: number, center: number) {
  return `translate(calc(-50% + ${slot * OFFSET_PERCENT + center}%), ${
    slot * -OFFSET_PERCENT
  }%) scale(${1 - slot * SCALE_STEP})`;
}

function SkeletonLine({ width }: { width: string }) {
  return (
    <span
      className="block h-2 rounded-full bg-foreground/10"
      style={{ width }}
    />
  );
}

type ShapeKey = 'short' | 'long' | 'question';

const SHAPE_ORDER: ShapeKey[] = ['short', 'long', 'question'];

/** 한 분야의 글 세 편. 카드마다 다른 묶음을 물려 여러 분야가 함께 보이게 한다. */
export interface ShapeExample {
  tag: string;
  longTitle: string;
  questionTitle: string;
}

function ShapePreview({
  shape,
  example: { tag, longTitle, questionTitle },
  resolvedBadge,
}: {
  shape: ShapeKey;
  example: ShapeExample;
  resolvedBadge: string;
}) {
  if (shape === 'short') {
    return (
      <div className="flex h-full flex-col p-5">
        <TypeTag label={shape.toUpperCase()} active />
        <div className="mt-4 flex flex-col gap-2.5">
          <SkeletonLine width="100%" />
          <SkeletonLine width="82%" />
        </div>
        <span className="mt-auto w-fit rounded-sm bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {tag}
        </span>
      </div>
    );
  }

  if (shape === 'long') {
    return (
      <div className="flex h-full flex-col p-5">
        <TypeTag label={shape.toUpperCase()} active />
        <div className="mt-4 flex flex-1 gap-3">
          <div className="flex flex-col items-center gap-2 pt-1.5">
            <span className="size-1.5 rounded-full bg-primary/60" />
            <span className="size-1.5 rounded-full bg-muted-foreground/30" />
            <span className="size-1.5 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm font-semibold leading-snug">{longTitle}</p>
            <SkeletonLine width="100%" />
            <SkeletonLine width="100%" />
            <SkeletonLine width="88%" />
            <SkeletonLine width="64%" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-5">
      <TypeTag label={shape.toUpperCase()} active />
      <div className="mt-4 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">{questionTitle}</p>
        <ResolvedPill className="shrink-0">{resolvedBadge}</ResolvedPill>
      </div>
      <div className="mt-4 flex flex-col gap-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-center gap-2">
          <CheckIcon className="size-3.5 shrink-0 text-primary" />
          <SkeletonLine width="70%" />
        </div>
        <SkeletonLine width="86%" />
      </div>
    </div>
  );
}

/** 카드 1 — 짧은 글·긴 글·질문 미리보기가 스택에서 하나씩 밀려 나온다. */
export default function PostShapeCarousel({
  examples,
  resolvedBadge,
}: {
  examples: ShapeExample[];
  resolvedBadge: string;
}) {
  const { playing, reducedMotion } = useReveal();
  const variantCount = Math.max(1, examples.length);
  const [state, setState] = useState<CarouselState>(() => ({
    // 처음 쌓이는 카드부터 서로 다른 묶음을 물려, 첫 화면에서 이미 여러 분야가 보인다.
    cards: Array.from({ length: SHAPE_ORDER.length + 1 }, (_unused, index) => ({
      id: index,
      slide: index % SHAPE_ORDER.length,
      slot: index < SHAPE_ORDER.length ? index : QUEUED,
      variant: index % variantCount,
    })),
    nextVariant: 0,
  }));

  useEffect(() => {
    if (!playing || reducedMotion) {
      return;
    }

    const cycle = window.setInterval(
      () =>
        setState((current) =>
          advance(current, SHAPE_ORDER.length, variantCount),
        ),
      DWELL_MS,
    );

    return () => window.clearInterval(cycle);
  }, [playing, reducedMotion, variantCount]);

  const center = stackCenter(SHAPE_ORDER.length);

  return (
    <div className="mt-4 min-h-0 flex-1" aria-hidden="true">
      <div className="relative h-full min-h-44 w-full overflow-hidden lg:min-h-0">
        {state.cards.map((card) => {
          const shape = SHAPE_ORDER[card.slide];
          const example = examples[card.variant];
          if (shape === undefined || example === undefined) {
            return null;
          }

          const isQueued = card.slot === QUEUED;
          const isEjected = card.slot === EJECTED;

          const transform = isEjected
            ? `translate(calc(-50% + ${center}%), ${EXIT_DROP}%) scale(1)`
            : slotTransform(
                isQueued ? SHAPE_ORDER.length - 1 + QUEUE_DEPTH : card.slot,
                center,
              );

          return (
            <div
              key={card.id}
              className="absolute overflow-hidden rounded-xl border border-border bg-background shadow-lg will-change-transform"
              style={{
                height: `${CARD_HEIGHT}%`,
                width: `${CARD_WIDTH}%`,
                left: '50%',
                bottom: `${CARD_INSET_Y}%`,
                transform,
                opacity: isQueued ? 0 : 1,
                zIndex: isEjected
                  ? SHAPE_ORDER.length + 2
                  : SHAPE_ORDER.length - card.slot,
                transition:
                  isQueued || reducedMotion
                    ? undefined
                    : isEjected
                      ? `transform ${PUSH_MS}ms ${EXIT_EASE}`
                      : `transform ${PUSH_MS}ms ${BOUNCE}, opacity ${FADE_MS}ms linear`,
              }}
            >
              <ShapePreview
                shape={shape}
                example={example}
                resolvedBadge={resolvedBadge}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
