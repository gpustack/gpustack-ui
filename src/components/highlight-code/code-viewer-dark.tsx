import CodeViewer from './code-viewer';
import './styles/dark.less';

interface CodeViewerProps {
  code: string;
  copyValue?: string;
  lang: string;
  autodetect?: boolean;
  ignoreIllegals?: boolean;
  copyable?: boolean;
  height?: string | number;
  style?: React.CSSProperties;
}
const DarkViewer: React.FC<CodeViewerProps> = (props) => {
  const {
    code,
    copyValue,
    lang,
    autodetect,
    ignoreIllegals,
    copyable,
    height = 'auto'
  } = props || {};

  return (
    <CodeViewer
      style={props.style}
      height={height}
      code={code}
      copyValue={copyValue}
      lang={lang}
      theme="dark"
      autodetect={autodetect}
      ignoreIllegals={ignoreIllegals}
      copyable={copyable}
    ></CodeViewer>
  );
};

export default DarkViewer;
