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
}
const LightViewer: React.FC<CodeViewerProps> = (props) => {
  const {
    code,
    lang,
    autodetect,
    ignoreIllegals,
    copyable,
    height = 'auto'
  } = props || {};

  return (
    <CodeViewer
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
