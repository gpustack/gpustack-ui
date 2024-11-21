import { memo } from 'react';
import CodeViewer from './code-viewer';
import './styles/light.less';

interface CodeViewerProps {
  code: string;
  lang: string;
  autodetect?: boolean;
  ignoreIllegals?: boolean;
  copyable?: boolean;
  height?: string | number;
  style?: React.CSSProperties;
}
const LightViewer: React.FC<CodeViewerProps> = (props) => {
  const {
    code,
    lang,
    autodetect,
    ignoreIllegals,
    copyable,
    style,
    height = 'auto'
  } = props || {};

  return (
    <CodeViewer
      style={style}
      height={height}
      code={code}
      lang={lang}
      theme="light"
      autodetect={autodetect}
      ignoreIllegals={ignoreIllegals}
      copyable={copyable}
    ></CodeViewer>
  );
};

export default memo(LightViewer);
