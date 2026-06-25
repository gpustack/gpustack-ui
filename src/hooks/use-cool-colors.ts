import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import { clampChroma, formatHex, modeOklch, modeRgb, useMode } from 'culori/fn';
import useUserSettings from './use-user-settings';

// Linear-style minimal/neutral palette: a TIGHT blue -> violet band in OKLCH
// (perceptually uniform), kept moderate-chroma so fills read as clean and gentle
// rather than candy-colored. We deliberately stay narrow and DON'T fan out to
// green/magenta — in this aesthetic series are separated by LIGHTNESS, not by
// spreading across the hue wheel. Every series (including the first) is generated
// from this one ramp, so the whole palette stays in a single cohesive color
// family — no special high-saturation brand color that clashes with the rest.
const COOL_HUE_START = 250; // blue
const COOL_HUE_END = 315; // violet (stops short of magenta/pink, stays neutral-cool)
const COOL_HUE_RANGE = COOL_HUE_END - COOL_HUE_START;

/**
 * Vivid, distinct cool accents — for places that need a handful of "primary"
 * colors, one per card/section (e.g. the summary trend cards), NOT a stacked
 * multi-series palette. Every color is anchor-quality (bright + saturated) and
 * spread evenly across the blue→violet band, so the set reads as several equally
 * strong primaries rather than one bold + several washed-out fills.
 */
export function useCoolAccents() {
  useMode(modeRgb);
  useMode(modeOklch);

  const { isDarkTheme } = useUserSettings();

  return useMemoizedFn((count: number): string[] => {
    if (count <= 0) return [];

    const l = isDarkTheme ? 0.62 : 0.64;
    const c = isDarkTheme ? 0.16 : 0.2;

    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = count <= 1 ? 0 : i / (count - 1);
      const hue = COOL_HUE_START + t * COOL_HUE_RANGE;
      out.push(
        formatHex(clampChroma({ mode: 'oklch', l, c, h: hue }, 'oklch'))
      );
    }
    return out;
  });
}

export default function useCoolColors() {
  useMode(modeRgb);
  useMode(modeOklch);

  const { isDarkTheme } = useUserSettings();

  return useMemoizedFn((count: number): string[] => {
    if (count <= 0) return [];

    // Moderate chroma: clean and crisp, but gentle (not neon). Too low reads as
    // muddy/dirty; too high reads as harsh. Dark mode a touch lower so fills
    // stay calm against the dark canvas.
    const baseChroma = isDarkTheme ? 0.085 : 0.12;

    // First series is the "primary" anchor: SAME blue family (the bluest end of
    // the ramp, nearest the brand hue) but clearly brighter and more saturated —
    // a vivid, clean brand-blue that reads as the base color. The rest of the
    // palette stays low-chroma, so the anchor pops as the primary while the
    // family still feels cohesive.
    const colors: string[] = [
      formatHex(
        clampChroma(
          {
            mode: 'oklch',
            l: isDarkTheme ? 0.62 : 0.66,
            c: isDarkTheme ? 0.16 : 0.2,
            h: COOL_HUE_START
          },
          'oklch'
        )
      )
    ];

    const rest = count - 1;
    if (rest <= 0) return colors;

    // Separation is driven by LIGHTNESS, not hue. The hue band is narrow, so as
    // the count grows we add lightness TIERS — each tier reuses the same narrow
    // hue ramp at a distinct lightness level, multiplying how many separable
    // colors fit while keeping the whole palette in one cohesive family.
    const tiers = rest <= 6 ? 1 : rest <= 12 ? 2 : 3;
    const steps = Math.ceil(rest / tiers);

    // Distinct lightness levels per tier count (index 0 → 2 tiers, 1 → 3 tiers).
    // Lighter, airier levels for a fresh/crisp feel; kept in the upper-mid range
    // so fills stay clean and legible.
    const lightTiers = isDarkTheme
      ? [
          [0.68, 0.5],
          [0.72, 0.6, 0.48]
        ]
      : [
          [0.82, 0.64],
          [0.84, 0.72, 0.6]
        ];
    // Single-tier light/dark zig-zag for the common small-count case.
    const [lightLo, lightHi] = isDarkTheme ? [0.5, 0.68] : [0.64, 0.82];

    for (let i = 0; i < rest; i++) {
      // Cycle the tier on every step so consecutive series always differ in
      // lightness — exactly where stacked bars are hardest to tell apart.
      const tier = i % tiers;
      const step = Math.floor(i / tiers);

      // Even hue ramp across the narrow band. Each tier is offset by a fraction
      // of a step so same-step colors in different tiers don't share a hue.
      const t = steps <= 1 ? 0.5 : (step + tier / tiers) / steps;
      const hue = COOL_HUE_START + t * COOL_HUE_RANGE;

      // 1 tier (≤6 series): light/dark zig-zag. 2-3 tiers: the tier's level.
      const lightness =
        tiers === 1 ? (i % 2 ? lightLo : lightHi) : lightTiers[tiers - 2][tier];

      // Clamp chroma into the sRGB gamut so values don't get distorted by a raw
      // channel clip when serialized to hex.
      colors.push(
        formatHex(
          clampChroma(
            { mode: 'oklch', l: lightness, c: baseChroma, h: hue },
            'oklch'
          )
        )
      );
    }

    return colors;
  });
}
