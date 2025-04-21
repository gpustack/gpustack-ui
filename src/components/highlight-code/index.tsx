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
    theme = 'dark',
    height = 'auto'
  } = props;

  const { userSettings } = useUserSettings();

  const currentTheme = React.useMemo(() => {
    return theme || userSettings.theme === 'realDark' ? 'dark' : 'light';
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
        />
      )}
    </div>
  );
};

export default React.memo(HighlightCode);
