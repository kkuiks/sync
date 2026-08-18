import { useId, useMemo } from 'react';

import { mulberry32, oklch, strHash } from '@/lib/generated-art';

interface GeneratedProjectAvatarProps {
  /** Pass `null` when no stable identifier exists — renders a fixed
   * grayscale empty-lot scene instead of a random skyline. */
  seed: string | null;
  className?: string;
}

const GROUND_Y = 94;
const MARGIN_X = 4;

interface Building {
  x: number;
  width: number;
  height: number;
  isLandmark: boolean;
  roof: 'flat' | 'peak' | 'antenna';
  windows: { x: number; y: number; lit: boolean }[];
}

function buildWindows(
  building: Pick<Building, 'x' | 'width' | 'height'>,
  litProbability: number,
  rand: () => number,
): Building['windows'] {
  const inset = 2.2;
  const size = 2.2;
  const gap = 3.6;
  const innerWidth = building.width - inset * 2;
  const innerHeight = building.height - inset * 2 - 4;
  if (innerWidth < size || innerHeight < size) {
    return [];
  }

  const cols = Math.max(1, Math.floor(innerWidth / gap));
  const rows = Math.max(1, Math.floor(innerHeight / gap));
  const colGap = innerWidth / cols;
  const rowGap = innerHeight / rows;

  const windows: Building['windows'] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      windows.push({
        x: building.x + inset + col * colGap + (colGap - size) / 2,
        y: GROUND_Y - building.height + inset + row * rowGap,
        lit: rand() < litProbability,
      });
    }
  }
  return windows;
}

/**
 * Seed-derived skyline avatar — the project analogue of `GeneratedAvatar`'s
 * face: a row of buildings in a contrasting hue sits on a flat sky, with one
 * taller "landmark" building carrying a distinct roofline and a scattering
 * of lit/unlit windows. Same seed always renders the same skyline. A `null`
 * seed renders a fixed grayscale empty lot instead.
 */
function GeneratedProjectAvatar({
  seed,
  className,
}: GeneratedProjectAvatarProps) {
  const clipId = useId();

  const scene = useMemo(() => {
    if (seed === null) {
      return {
        dead: true as const,
        sky: oklch(0.85, 0, 0),
        ground: oklch(0.68, 0, 0),
      };
    }

    const rand = mulberry32(strHash(seed));
    const hueA = rand() * 360;
    const hueB = (hueA + 150 + rand() * 60) % 360;

    const sky = oklch(0.83, 0.05, hueA);
    const ground = oklch(0.58, 0.05, hueA);
    const buildingColor = oklch(0.6, 0.14, hueB);
    const landmarkColor = oklch(0.52, 0.16, hueB);
    const ink = oklch(0.2, 0.06, hueB);
    const litWindow = oklch(0.88, 0.15, 85);

    const count = 3 + Math.floor(rand() * 3);
    const usableWidth = 100 - MARGIN_X * 2;
    const slotWidth = usableWidth / count;
    const landmarkIndex = Math.floor(rand() * count);
    const litProbability = 0.3 + rand() * 0.35;

    const buildings: Building[] = [];
    for (let i = 0; i < count; i++) {
      const isLandmark = i === landmarkIndex;
      const width = slotWidth * (0.55 + rand() * 0.3);
      const jitter = (rand() - 0.5) * (slotWidth - width) * 0.6;
      const x = MARGIN_X + i * slotWidth + (slotWidth - width) / 2 + jitter;
      const baseHeight = 20 + rand() * 28;
      const height = isLandmark ? baseHeight + 16 + rand() * 10 : baseHeight;
      const roof = isLandmark ? (rand() < 0.5 ? 'peak' : 'antenna') : 'flat';

      const partial = { x, width, height };
      buildings.push({
        ...partial,
        isLandmark,
        roof,
        windows: buildWindows(partial, litProbability, rand),
      });
    }

    return {
      dead: false as const,
      sky,
      ground,
      buildingColor,
      landmarkColor,
      ink,
      litWindow,
      litProbability,
      buildings,
    };
  }, [seed]);

  const clipRect = (
    <defs>
      <clipPath id={clipId}>
        <rect x={0} y={0} width={100} height={100} rx={20} ry={20} />
      </clipPath>
    </defs>
  );

  if (scene.dead) {
    return (
      <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden>
        {clipRect}
        <g clipPath={`url(#${clipId})`}>
          <rect x={0} y={0} width={100} height={100} fill={scene.sky} />
          <rect
            x={0}
            y={GROUND_Y}
            width={100}
            height={100 - GROUND_Y}
            fill={scene.ground}
          />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden>
      {clipRect}
      <g clipPath={`url(#${clipId})`}>
        <rect x={0} y={0} width={100} height={100} fill={scene.sky} />

        {scene.buildings.map((building, index) => {
          const top = GROUND_Y - building.height;
          const fill = building.isLandmark
            ? scene.landmarkColor
            : scene.buildingColor;

          return (
            <g key={index}>
              <rect
                x={building.x}
                y={top}
                width={building.width}
                height={building.height}
                fill={fill}
              />
              {building.roof === 'peak' && (
                <path
                  d={`M ${building.x} ${top} L ${building.x + building.width / 2} ${top - 9} L ${building.x + building.width} ${top}`}
                  fill={fill}
                />
              )}
              {building.roof === 'antenna' && (
                <>
                  <line
                    x1={building.x + building.width / 2}
                    y1={top}
                    x2={building.x + building.width / 2}
                    y2={top - 9}
                    stroke={scene.ink}
                    strokeWidth={1.4}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={building.x + building.width / 2}
                    cy={top - 9}
                    r={1.6}
                    fill={scene.litWindow}
                  />
                </>
              )}
              {building.windows.map((w, windowIndex) => (
                <rect
                  key={windowIndex}
                  x={w.x}
                  y={w.y}
                  width={2.2}
                  height={2.2}
                  rx={0.4}
                  fill={w.lit ? scene.litWindow : scene.ink}
                  opacity={w.lit ? 1 : 0.55}
                />
              ))}
            </g>
          );
        })}

        <rect
          x={0}
          y={GROUND_Y}
          width={100}
          height={100 - GROUND_Y}
          fill={scene.ground}
        />
      </g>
    </svg>
  );
}

export { GeneratedProjectAvatar };
