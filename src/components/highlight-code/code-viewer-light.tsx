import CodeViewer from './code-viewer';
import './styles/light.less';

interface CodeViewerProps {
  code: string;
  copyValue?: string;
  lang: string;
  autodetect?: boolean;
  ignoreIllegals?: boolean;
  copyable?: boolean;
  height?: string | number;
  style?: React.CSSProperties;
  xScrollable?: boolean;
}
const LightViewer: React.FC<CodeViewerProps> = (props) => {
  const {
    code,
    copyValue,
    lang,
    autodetect,
    ignoreIllegals,
    copyable,
    style,
    height = 'auto',
    xScrollable = false
  } = props || {};

  return (
    <CodeViewer
      style={style}
      height={height}
      code={code}
      copyValue={copyValue}
      lang={lang}
      theme="light"
      autodetect={autodetect}
      ignoreIllegals={ignoreIllegals}
      copyable={copyable}
      xScrollable={xScrollable}
    ></CodeViewer>
  );
};

export default LightViewer;
