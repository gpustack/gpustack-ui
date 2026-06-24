import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import { converter, modeHsl, modeRgb, useMode } from 'culori/fn';

const toHsl = converter('hsl');

const DEFAULT_BRAND_HUE = 211; // brand color (HSL hue)

// Cool palette spans blue -> violet. The range starts just above the brand hue
// so generated colors never sit right next to the brand color.
const COOL_HUE_START = 215;
const COOL_HUE_END = 310;
const COOL_HUE_RANGE = COOL_HUE_END - COOL_HUE_START;

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

    // First series keeps the brand color.
    const colors: string[] = [`hsl(${brandHue}, 100%, 50%)`];

    const rest = count - 1;
    for (let i = 0; i < rest; i++) {
      // Evenly divide the hue range. Because `count` is known up front, even
      // spacing guarantees the largest possible minimum gap between any two
      // hues — golden-ratio sampling can land two values close together after
      // wrapping into this narrow cool band.
      const t = rest <= 1 ? 0.5 : (i + 0.5) / rest;
      const hue = COOL_HUE_START + t * COOL_HUE_RANGE;

      // Zig-zag saturation/lightness on a second axis. HSL is not perceptually
      // uniform (blues/purples look alike at equal hue steps), so alternating
      // lightness is what keeps adjacent series clearly distinct.
      const saturation = 72 + (i % 3) * 9; // 72 / 81 / 90
      const lightness = i % 2 ? 46 : 62; // alternate darker / lighter

      colors.push(`hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`);
    }

    return colors;
  });
}
