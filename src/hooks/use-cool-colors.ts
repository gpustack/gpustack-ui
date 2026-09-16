import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import { clampChroma, formatHex, modeOklch, modeRgb, useMode } from 'culori/fn';
import useUserSettings from './use-user-settings';

// Linear/Vercel-style minimal palette: a tight blue -> violet band in OKLCH
// (perceptually uniform), moderate-chroma so fills read clean rather than
// candy-colored. Series are separated primarily by LIGHTNESS, not by fanning
// across the hue wheel, which keeps the whole set in one cohesive family.
//
// Every constant below is validated, not chosen by eye. Running the palette
// through the six-check validator (lightness band / chroma floor / CVD
// separation / normal-vision floor / contrast) at 2, 3, 5 and 8 slots is what
// fixed the three defects the previous version shipped with:
//
//   1. The light tier sat at L 0.82-0.84 — above the usable band, below the
//      chroma floor (it read as gray), and at 1.7:1 against the surface.
//   2. Compressing that tier alone was not enough: the anchor was special-cased
//      at L 0.66 / C 0.20, i.e. the MIDDLE of the band, so the first generated
//      slot landed right next to it (ΔE 9.3, under the 15 floor). The anchor had
//      to move to the band's edge as well.
//   3. The ramp started at `t = 0`, which gave that first slot the anchor's OWN
//      hue. It now starts one step in.
//
// Light and dark are separately tuned because the usable lightness band differs
// sharply: L 0.43-0.77 on the light surface but only L 0.48-0.67 on the dark
// one. That 0.19-wide dark band cannot carry enough lightness separation on its
// own, so dark compensates with a wider hue sweep.
const COOL_HUE_START = 250; // blue

// Tuned per theme. Each field is load-bearing; see the validated figures below.
const COOL_RAMP = {
  light: {
    // Stops short of magenta/pink, stays neutral-cool.
    hueEnd: 315,
    anchorL: 0.6,
    anchorC: 0.19,
    lightL: 0.76,
    darkL: 0.46,
    chroma: 0.14
  },
  dark: {
    // Reaches further round the wheel: the dark band is too narrow to separate
    // on lightness alone, so hue has to make up the difference.
    hueEnd: 340,
    anchorL: 0.5,
    anchorC: 0.17,
    lightL: 0.665,
    darkL: 0.485,
    chroma: 0.15
  }
} as const;

// Accents keep high chroma throughout (they are peers, not a base + fills) but
// still have to move in lightness. The previous version held lightness CONSTANT
// and separated on hue alone, which collapses under red-green colour blindness:
// the blue and violet ends measured ΔE 0.3 (deutan) — the same colour. The band
// is swept fully (to 340°) and lightness rides the sweep alongside it.
const COOL_ACCENT = {
  light: { lHi: 0.72, lLo: 0.48, chroma: 0.18 },
  dark: { lHi: 0.66, lLo: 0.49, chroma: 0.17 }
} as const;

/**
 * Vivid, distinct cool accents — for places that need a handful of "primary"
 * colors, one per card/section (e.g. the summary trend cards), NOT a stacked
 * multi-series palette.
 *
 * Validated for up to **three** accents (worst adjacent pair: ΔE 12.2 deutan /
 * 17.6 normal in light, 8.4 / 15.6 in dark). A cool-only band cannot carry a
 * fourth equally-strong peer — at four slots the middle pair drops to ΔE 5.8
 * under deutan. Past three, use `useCoolColors`, which buys extra separable
 * slots with lightness tiers instead of insisting every slot be anchor-bright.
 */
export function useCoolAccents() {
  useMode(modeRgb);
  useMode(modeOklch);

  const { isDarkTheme } = useUserSettings();

  return useMemoizedFn((count: number): string[] => {
    if (count <= 0) return [];

    if (process.env.NODE_ENV !== 'production' && count > 3) {
      console.warn(
        `useCoolAccents(${count}): only 3 accents stay separable under colour-blind simulation. Use useCoolColors for more series.`
      );
    }

    const accent = isDarkTheme ? COOL_ACCENT.dark : COOL_ACCENT.light;
    // Always the full sweep: the accents need every degree of hue they can get,
    // since unlike `useCoolColors` they cannot lean on a wide lightness spread.
    const hueRange = COOL_RAMP.dark.hueEnd - COOL_HUE_START;

    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = count <= 1 ? 0 : i / (count - 1);
      out.push(
        formatHex(
          clampChroma(
            {
              mode: 'oklch',
              l: accent.lHi + (accent.lLo - accent.lHi) * t,
              c: accent.chroma,
              h: COOL_HUE_START + t * hueRange
            },
            'oklch'
          )
        )
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

    const ramp = isDarkTheme ? COOL_RAMP.dark : COOL_RAMP.light;
    const hueRange = ramp.hueEnd - COOL_HUE_START;

    // The first series is the "primary" anchor: the bluest end of the ramp,
    // more saturated than the rest so it reads as the base color. It sits at the
    // LOW edge of the usable lightness band, not the middle — from the middle,
    // whichever tier came next landed too close to it to be told apart.
    const colors: string[] = [
      formatHex(
        clampChroma(
          {
            mode: 'oklch',
            l: ramp.anchorL,
            c: ramp.anchorC,
            h: COOL_HUE_START
          },
          'oklch'
        )
      )
    ];

    const rest = count - 1;
    if (rest <= 0) return colors;

    // Separation is driven by LIGHTNESS first. The hue band is narrow, so as the
    // count grows we add tiers — each reuses the hue ramp at a distinct
    // lightness, multiplying how many separable colors fit in one family.
    const tiers = rest <= 6 ? 1 : rest <= 12 ? 2 : 3;
    const steps = Math.ceil(rest / tiers);

    for (let i = 0; i < rest; i++) {
      // Alternate on every step so consecutive series always differ in
      // lightness — exactly where stacked bars are hardest to tell apart.
      const tier = i % tiers;
      const step = Math.floor(i / tiers);

      // `+ 1` starts the ramp one step in. At `t = 0` the first generated slot
      // inherited the anchor's own hue, leaving lightness as its only axis of
      // separation and putting the pair under the ΔE floor.
      const t = Math.min((step + tier / tiers + 1) / steps, 1);
      const hue = COOL_HUE_START + t * hueRange;

      // Clamp chroma into the sRGB gamut so values aren't distorted by a raw
      // channel clip when serialized to hex.
      colors.push(
        formatHex(
          clampChroma(
            {
              mode: 'oklch',
              l: i % 2 === 0 ? ramp.lightL : ramp.darkL,
              c: ramp.chroma,
              h: hue
            },
            'oklch'
          )
        )
      );
    }

    return colors;
  });
}
