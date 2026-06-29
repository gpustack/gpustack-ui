import { createStyles } from 'antd-style';
import React from 'react';

export type PreviewMode = 'light' | 'realDark' | 'auto';

const PALETTE = {
  light: {
    surface: '#ffffff',
    bar: '#e7ebf2',
    block: '#f1f4f9',
    accent: '#cdd7e8'
  },
  dark: {
    surface: '#0f1729',
    bar: '#1d2740',
    block: '#27324d',
    accent: '#39445f'
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
