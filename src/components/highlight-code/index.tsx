import useUserSettings from '@/hooks/use-user-settings';
import React from 'react';
import CodeViewerDark from './code-viewer-dark';
import CodeViewerLight from './code-viewer-light';
import './styles/index.less';

const HighlightCode: React.FC<{
  code: string;
  lang?: string;
  copyable?: boolean;
  theme?: 'light' | 'dark';
  fixedTheme?: 'light' | 'dark';
  xScrollable?: boolean;
  height?: string | number;
  style?: React.CSSProperties;
  copyValue?: string;
}> = (props) => {
  const {
    style,
    code,
    copyValue,
    lang = 'bash',
    copyable = true,
    theme,
    height = 'auto',
    xScrollable = false
  } = props;

  const { userSettings } = useUserSettings();

  const currentTheme = React.useMemo(() => {
    const res = theme || userSettings.theme === 'realDark' ? 'dark' : 'light';
    return res;
  }, [theme, userSettings.theme]);

  return (
    <div className="high-light-wrapper hj-wrapper">
      {currentTheme === 'dark' ? (
        <CodeViewerDark
          lang={lang}
          code={code}
          copyValue={copyValue}
          copyable={copyable}
          height={height}
          xScrollable={xScrollable}
          style={style}
        />
      ) : (
        <CodeViewerLight
          style={style}
          lang={lang}
          code={code}
          copyValue={copyValue}
          copyable={copyable}
          height={height}
          xScrollable={xScrollable}
        />
      )}
    </div>
  );
};

export default HighlightCode;
