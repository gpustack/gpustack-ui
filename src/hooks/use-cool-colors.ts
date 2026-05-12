import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import { converter, modeHsl, modeRgb, useMode } from 'culori/fn';

const toHsl = converter('hsl');

const DEFAULT_BRAND_HUE = 211; // brand color
const COOL_HUE_START = 180;
const COOL_HUE_END = 280;
const COOL_HUE_RANGE = COOL_HUE_END - COOL_HUE_START;
const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;

function colorStringToHue(input?: string): number | undefined {
  if (!input) return undefined;
  const color = toHsl(input);
  if (!color || typeof color.h !== 'number') return undefined;
  return color.h;
}

export default function useCoolColors() {
  // const brandHue = useMemo(
  //   () => colorStringToHue(userSettings.colorPrimary) ?? DEFAULT_BRAND_HUE,
  //   [userSettings.colorPrimary]
  // );
  useMode(modeRgb);
  useMode(modeHsl);

  const brandHue = DEFAULT_BRAND_HUE;

  return useMemoizedFn((count: number): string[] => {
    if (count <= 0) return [];

    const colors: string[] = [];

    for (let i = 0; i < count; i++) {
      let hue: number;

      if (i === 0) {
        hue = brandHue - 5;
      } else {
        const offset = (i * GOLDEN_RATIO_CONJUGATE) % 1;
        hue = COOL_HUE_START + offset * COOL_HUE_RANGE;

        if (Math.abs(hue - brandHue) < 5) {
          hue = (hue + 10) % COOL_HUE_END;
        }
      }

      const s = i === 0 ? 100 : 75 + (i % 3) * 5;
      const l = i === 0 ? 50 : 55 + (i % 2) * 5;

      colors.push(`hsl(${Math.round(hue)}, ${s}%, ${l}%)`);
    }

    return colors;
  });
}
