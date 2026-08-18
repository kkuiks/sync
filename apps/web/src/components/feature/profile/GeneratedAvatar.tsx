import { useId, useMemo } from 'react';

import { mulberry32, oklch, strHash } from '@/lib/generated-art';

interface GeneratedAvatarProps {
  /** Pass `null` when no stable identifier exists — renders a fixed
   * grayscale "no identity" face (X eyes) instead of a random one. */
  seed: string | null;
  className?: string;
}

const EYE_GAP_MIN = 24;
const EYE_GAP_MAX = 40;
const DEAD_EYE_GAP = 32;

/**
 * Seed-derived smiley avatar: a face plate — a second, randomly placed
 * circle in a contrasting hue — sits inside the frame circle, revealing a
 * crescent of the base color, with a variable-openness mouth and an
 * occasional wink (curve, outward chevron, or inward three-stroke arrow)
 * drawn on top. Same seed always renders the same avatar. A `null` seed
 * renders a fixed grayscale face with X eyes instead.
 */
function GeneratedAvatar({ seed, className }: GeneratedAvatarProps) {
  const clipId = useId();

  const face = useMemo(() => {
    if (seed === null) {
      return {
        dead: true as const,
        background: oklch(0.82, 0, 0),
        faceBackground: oklch(0.62, 0, 0),
        ink: oklch(0.22, 0, 0),
        innerCx: 50,
        innerCy: 50,
        innerR: 46,
        offsetX: 0,
        offsetY: 0,
        tilt: 0,
      };
    }

    const rand = mulberry32(strHash(seed));
    const hueA = rand() * 360;
    const hueB = (hueA + 150 + rand() * 60) % 360;

    const innerR = 44 + rand() * 8;
    const innerAngle = rand() * Math.PI * 2;
    const innerOffset = rand() * 14;
    const innerCx = 50 + Math.cos(innerAngle) * innerOffset;
    const innerCy = 50 + Math.sin(innerAngle) * innerOffset;

    const side = rand() < 0.5 ? -1 : 1;
    const winkRoll = rand();
    const winkEyes: 'none' | 'left' | 'right' | 'both' =
      winkRoll < 0.5
        ? 'none'
        : winkRoll < 0.66
          ? 'left'
          : winkRoll < 0.82
            ? 'right'
            : 'both';
    const styleRoll = rand();
    // Both eyes as a "^ ^" chevron pair reads unsettling rather than cute, so
    // that combination is excluded — chevron only ever applies to one eye.
    const winkStyle: 'curve' | 'chevron' | 'arrow' =
      winkEyes === 'both'
        ? styleRoll < 0.5
          ? 'curve'
          : 'arrow'
        : styleRoll < 1 / 3
          ? 'curve'
          : styleRoll < 2 / 3
            ? 'chevron'
            : 'arrow';

    return {
      dead: false as const,
      background: oklch(0.7, 0.13, hueA),
      faceBackground: oklch(0.6, 0.14, hueB),
      ink: oklch(0.2, 0.06, hueB),
      innerCx,
      innerCy,
      innerR,
      offsetX: side * (2 + rand() * 4),
      offsetY: -2 + rand() * 3,
      tilt: side * (2 + rand() * 6),
      eyeGap: EYE_GAP_MIN + rand() * (EYE_GAP_MAX - EYE_GAP_MIN),
      smileWidth: 20 + rand() * 7,
      lipCurve: 7 + rand() * 5,
      mouthOpen: rand() * 12,
      winkEyes,
      winkStyle,
    };
  }, [seed]);

  const cx = face.innerCx + face.offsetX;
  const cy = face.innerCy + face.offsetY;

  const eyeY = cy - 9;
  const mouthY = cy + 7;

  const clipCircle = (
    <defs>
      <clipPath id={clipId}>
        <circle cx={50} cy={50} r={50} />
      </clipPath>
    </defs>
  );

  if (face.dead) {
    const xMark = (x: number) => (
      <g stroke={face.ink} strokeWidth={4.2} strokeLinecap="round">
        <line x1={x - 5} y1={eyeY - 5} x2={x + 5} y2={eyeY + 5} />
        <line x1={x - 5} y1={eyeY + 5} x2={x + 5} y2={eyeY - 5} />
      </g>
    );

    return (
      <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden>
        {clipCircle}
        <g clipPath={`url(#${clipId})`}>
          <circle cx={50} cy={50} r={50} fill={face.background} />
          <circle
            cx={face.innerCx}
            cy={face.innerCy}
            r={face.innerR}
            fill={face.faceBackground}
          />
          {xMark(cx - DEAD_EYE_GAP / 2)}
          {xMark(cx + DEAD_EYE_GAP / 2)}
          <line
            x1={cx - 11}
            y1={mouthY}
            x2={cx + 11}
            y2={mouthY}
            stroke={face.ink}
            strokeWidth={4}
            strokeLinecap="round"
          />
        </g>
      </svg>
    );
  }

  const mouthWidth = face.smileWidth + face.mouthOpen * 0.3;
  const mouthLeftX = cx - mouthWidth / 2;
  const mouthRightX = cx + mouthWidth / 2;
  const topLipY = mouthY - face.lipCurve * 0.25;
  const bottomLipY = mouthY + face.lipCurve + face.mouthOpen;

  // Both edges share the same two mouth-corner points and only bow apart in
  // the middle — a near-zero gap reads as a closed-lip smile, a wide gap as
  // an open grin, with no seam at the corners.
  const mouthPath = [
    `M ${mouthLeftX} ${mouthY}`,
    `Q ${cx} ${topLipY} ${mouthRightX} ${mouthY}`,
    `Q ${cx} ${bottomLipY} ${mouthLeftX} ${mouthY}`,
    'Z',
  ].join(' ');

  // A bold "^" tilted outward, away from the nose — a raised-eyebrow squint.
  const chevronEye = (x: number) => {
    const outward = x < cx ? -1 : 1;
    return (
      <path
        d={`M ${x - 6.4} ${eyeY + 2.2} L ${x} ${eyeY - 4.4} L ${x + 6.4} ${eyeY + 2.2}`}
        fill="none"
        stroke={face.ink}
        strokeWidth={4.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`rotate(${outward * 18} ${x} ${eyeY})`}
      />
    );
  };

  // A three-stroke arrow — shaft plus two head strokes, all the same
  // length — pointing inward toward the nose.
  const arrowEye = (x: number) => {
    const inward = x < cx ? 1 : -1;
    const len = 8.4;
    const headAngle = (35 * Math.PI) / 180;
    const tailX = x - inward * len;
    const wingX = x - inward * len * Math.cos(headAngle);
    const wingY = len * Math.sin(headAngle);

    return (
      <path
        d={`M ${tailX} ${eyeY} L ${x} ${eyeY} L ${wingX} ${eyeY - wingY} M ${x} ${eyeY} L ${wingX} ${eyeY + wingY}`}
        fill="none"
        stroke={face.ink}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };

  const eye = (x: number, winking: boolean) => {
    if (!winking) {
      return <circle cx={x} cy={eyeY} r={5} fill={face.ink} />;
    }
    if (face.winkStyle === 'chevron') {
      return chevronEye(x);
    }
    if (face.winkStyle === 'arrow') {
      return arrowEye(x);
    }
    return (
      <path
        d={`M ${x - 6} ${eyeY} Q ${x} ${eyeY - 4.8} ${x + 6} ${eyeY}`}
        fill="none"
        stroke={face.ink}
        strokeWidth={4}
        strokeLinecap="round"
      />
    );
  };

  const leftWinking = face.winkEyes === 'left' || face.winkEyes === 'both';
  const rightWinking = face.winkEyes === 'right' || face.winkEyes === 'both';

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden>
      {clipCircle}
      <g clipPath={`url(#${clipId})`}>
        <circle cx={50} cy={50} r={50} fill={face.background} />
        <circle
          cx={face.innerCx}
          cy={face.innerCy}
          r={face.innerR}
          fill={face.faceBackground}
        />
        <g transform={`rotate(${face.tilt} ${cx} ${cy})`}>
          {eye(cx - face.eyeGap / 2, leftWinking)}
          {eye(cx + face.eyeGap / 2, rightWinking)}
          <path d={mouthPath} fill={face.ink} />
        </g>
      </g>
    </svg>
  );
}

export { GeneratedAvatar };
