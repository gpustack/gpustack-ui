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
}> = (props) => {
  const {
    code,
    lang = 'bash',
    copyable = true,
    theme = 'dark',
    height = 'auto'
  } = props;

  return (
    <div className="high-light-wrapper hj-wrapper">
      {theme === 'dark' ? (
        <CodeViewerDark
          lang={lang}
          code={code}
          copyable={copyable}
          height={height}
        />
      ) : (
        <CodeViewerLight
          lang={lang}
          code={code}
          copyable={copyable}
          height={height}
        />
      )}
    </div>
  );
};

export default React.memo(HighlightCode);
