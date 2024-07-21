import CodeViewer from './code-viewer';
import './style.less';

const HighlightCode: React.FC<{
  code: string;
  lang?: string;
}> = (props) => {
  const { code, lang = 'bash' } = props;

  return (
    <div className="high-light-wrapper">
      <CodeViewer lang={lang} code={code} />
    </div>
  );
};

export default HighlightCode;
