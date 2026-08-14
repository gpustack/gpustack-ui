import _ from 'lodash';
import React from 'react';

interface HalfArcGaugeProps {
  // null keeps the track and prints "--": no data, which is not the same thing
  // as zero.
  percent: number | null;
  // Value arc colour. Thresholds are the caller's business, not the gauge's.
  color?: string;
  // Width in px. The height follows from the geometry, which is the whole point
  // of this component: antd's `Progress type="dashboard"` draws a half ring
  // inside a full SIZE x SIZE square, so a third of the box is empty but still
  // reserves layout — in a table row that is wasted height on every row.
  size?: number;
  strokeWidth?: number;
  railColor?: string;
  textColor?: string;
  // Marks "there is more behind this" under the percent, the same affordance
  // the global .dashed-underline class gives HTML text. Drawn rather than
  // styled: a border does not apply to SVG text. It stays inside the existing
  // box — the percent has no descenders to clear — so an underlined gauge is
  // exactly as tall as a plain one and rows keep their alignment.
  dashedUnderline?: boolean;
}

const FONT_SIZE = 12;
// The percent's baseline, measured from the diameter (negative = up into the
// arc). At -5 the digits sit around the arc's visual centre and leave room for
// the underline; at 0 they would rest on the diameter.
const TEXT_BASELINE_OFFSET = 2;
// Distance from that baseline down to the dashed underline.
const UNDERLINE_GAP = 4;

// Rough advance widths at FONT_SIZE for the only glyphs this gauge prints, so
// the underline tracks the number instead of guessing a fixed width. Measuring
// it exactly would need a ref and a layout pass — not worth it for a hairline.
const GLYPH_WIDTHS: Record<string, number> = { '%': 9, '-': 4 };
const textWidth = (text: string) =>
  _.sum([...text].map((char) => GLYPH_WIDTHS[char] ?? 7));

/**
 * A half-ring gauge: one track arc, one value arc, and the percent centred on
 * the diameter — in a box only as tall as what it draws.
 *
 * The arc is drawn once and revealed by `stroke-dasharray`, so the value is
 * exact at any size and needs no per-percent path maths.
 */
const HalfArcGauge: React.FC<HalfArcGaugeProps> = ({
  percent,
  color = 'var(--ant-color-primary)',
  size = 50,
  strokeWidth = 8,
  railColor = 'var(--ant-color-fill-tertiary)',
  textColor = 'var(--ant-color-text-secondary)',
  dashedUnderline = false
}) => {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const baseline = center + TEXT_BASELINE_OFFSET;
  const underlineY = baseline + UNDERLINE_GAP;
  // The diameter sits at `center`, and nothing below it needs room except a few
  // px of breathing space — so the box stops there instead of at a full square.
  // Takes the underline into account, so tuning the offsets can never clip it
  // and an underlined gauge is never taller than a plain one.
  const height = Math.max(center + 3, underlineY + 2);
  const arc = `M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`;
  const arcLength = Math.PI * radius;
  const ratio = percent === null ? 0 : _.clamp(percent, 0, 100) / 100;
  const text = percent === null ? '--' : `${percent}%`;
  const underlineHalfWidth = textWidth(text) / 2;

  return (
    <svg
      width={size}
      height={height}
      viewBox={`0 0 ${size} ${height}`}
      // block kills the inline-baseline gap under the svg; the gauge must not
      // be squashed when it sits in a flex row of them.
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d={arc} fill="none" stroke={railColor} strokeWidth={strokeWidth} />
      {ratio > 0 && (
        <path
          d={arc}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          // Flat ends: round caps would add half a stroke width to each end,
          // which fattens the arc and makes a 1% reading look like a real slice.
          strokeLinecap="butt"
          strokeDasharray={`${arcLength * ratio} ${arcLength}`}
        />
      )}
      <text
        x={center}
        y={baseline}
        textAnchor="middle"
        fontSize={FONT_SIZE}
        fontWeight={500}
        fill={textColor}
        // Tabular figures so a value that changes on every poll doesn't make
        // the label jitter.
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {text}
      </text>
      {dashedUnderline && (
        <line
          x1={center - underlineHalfWidth}
          x2={center + underlineHalfWidth}
          y1={underlineY}
          y2={underlineY}
          stroke="var(--ant-blue-6)"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      )}
    </svg>
  );
};

export default HalfArcGauge;
