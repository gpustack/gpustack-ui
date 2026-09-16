export const COLOR_PRIMARY = '#007BFF';

/**
 * One font stack, shared by both themes.
 *
 * Order matters and each group earns its place:
 *  1. `system-ui` — the platform's own UI grotesque (SF Pro / Segoe UI
 *     Variable). The stack this replaced led with `Helvetica Neue`, which does
 *     not exist on Windows or Linux, and fell through `-apple-system` and
 *     `BlinkMacSystemFont` (both no-ops off Apple/Chrome) all the way to Arial.
 *  2. Explicit Apple/Windows names, for browsers that still don't map
 *     `system-ui`.
 *  3. CJK faces — the product ships zh-CN and ja-JP, and the old stack had no
 *     CJK entry at all, so those locales fell to the browser default (a serif
 *     on older Windows) and rendered in a different family from the Latin text
 *     next to them.
 *  4. Emoji, last, so they never win for Latin or CJK glyphs.
 */
export const FONT_FAMILY = [
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  "'Segoe UI'",
  "'Helvetica Neue'",
  'Arial',
  "'PingFang SC'",
  "'Hiragino Sans GB'",
  "'Microsoft YaHei'",
  "'Noto Sans CJK SC'",
  "'Noto Sans'",
  'sans-serif',
  "'Apple Color Emoji'",
  "'Segoe UI Emoji'",
  "'Segoe UI Symbol'",
  "'Noto Color Emoji'"
].join(', ');
