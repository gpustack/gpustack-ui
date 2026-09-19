import { createStyles } from 'antd-style';
import React from 'react';

export type PreviewMode = 'light' | 'realDark' | 'auto';

/**
 * A symbol of each theme, not a screenshot of it — an accurate light preview is
 * unusable, because the real light theme's own surfaces (`#fdfdfd` container on
 * `#f4f5f6` layout) sit 1.03:1 apart and render as a blank rectangle. So the
 * light side's internal contrast is deliberately exaggerated; what IS taken
 * from the themes is their neutral cast and two real values — `#d3d8de` and
 * `#3a3a3a` are each theme's `colorBorder`, `#1e1e1e` dark's
 * `colorBgContainer`.
 *
 * The previous palette was a navy invention (`#0f1729`…) matching neither
 * theme, and it left the three tiles wildly unequal for three peer options:
 * measured against the page, every layer of the light tile fell in 1.02–1.43
 * (no shape at all, just its border) while the dark tile ran 9.5–17.6. Fixing
 * that is mostly about giving the LIGHT tile ink — a dark swatch on a light
 * page is high-contrast by nature and should not be flattened into grey.
 */
const PALETTE = {
  light: {
    surface: '#ffffff',
    bar: '#d3d8de',
    block: '#eef0f3',
    accent: '#b9c0ca'
  },
  dark: {
    surface: '#1e1e1e',
    bar: '#3a3a3a',
    block: '#2b2b2b',
    accent: '#4a4a4a'
  }
};

const useStyles = createStyles(({ css }) => ({
  preview: css`
    width: 100%;
    aspect-ratio: 16 / 10;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    pointer-events: none;
    user-select: none;
  `,
  half: css`
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 8px;
    overflow: hidden;
  `,
  topbar: css`
    height: 8px;
    border-radius: 3px;
    flex-shrink: 0;
  `,
  body: css`
    flex: 1;
    display: flex;
    gap: 8px;
  `,
  sidebar: css`
    width: 22%;
    border-radius: 4px;
  `,
  main: css`
    flex: 1;
    border-radius: 4px;
  `,
  footer: css`
    height: 6px;
    border-radius: 3px;
    flex-shrink: 0;
  `,
  systemIcon: css`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    color: rgba(255, 255, 255, 0.55);
    mix-blend-mode: difference;
    z-index: 2;
  `,
  systemWrap: css`
    position: relative;
  `
}));

const Mockup: React.FC<{ tone: 'light' | 'dark'; flex?: number }> = ({
  tone,
  flex = 1
}) => {
  const { styles } = useStyles();
  const c = PALETTE[tone];
  return (
    <div
      className={styles.half}
      style={{ background: c.surface, flex, minWidth: 0 }}
    >
      <div className={styles.topbar} style={{ background: c.accent }} />
      <div className={styles.body}>
        <div className={styles.sidebar} style={{ background: c.block }} />
        <div className={styles.main} style={{ background: c.block }} />
      </div>
      <div className={styles.footer} style={{ background: c.bar }} />
    </div>
  );
};

const ThemePreview: React.FC<{ mode: PreviewMode }> = ({ mode }) => {
  const { styles } = useStyles();

  if (mode === 'auto') {
    return (
      <div className={`${styles.preview} ${styles.systemWrap}`}>
        <Mockup tone="light" />
        <Mockup tone="dark" />
      </div>
    );
  }

  return (
    <div className={styles.preview}>
      <Mockup tone={mode === 'realDark' ? 'dark' : 'light'} />
    </div>
  );
};

ThemePreview.displayName = 'ThemePreview';

export default ThemePreview;
