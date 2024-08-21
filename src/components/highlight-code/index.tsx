import CodeViewer from './code-viewer';
import './style.less';

const HighlightCode: React.FC<{
  code: string;
  lang?: string;
  copyable?: boolean;
}> = (props) => {
  const { code, lang = 'bash', copyable = true } = props;

  return (
    <div className="high-light-wrapper">
      <CodeViewer lang={lang} code={code} copyable={copyable} />
    </div>
  );
};

export default HighlightCode;
