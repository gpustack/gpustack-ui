import CodeViewerDark from './code-viewer-dark';
import CodeViewerLight from './code-viewer-light';
import './styles/index.less';

const HighlightCode: React.FC<{
  code: string;
  lang?: string;
  copyable?: boolean;
  theme?: 'light' | 'dark';
}> = (props) => {
  const { code, lang = 'bash', copyable = true, theme = 'dark' } = props;

  return (
    <div className="high-light-wrapper">
      {theme === 'dark' ? (
        <CodeViewerDark lang={lang} code={code} copyable={copyable} />
      ) : (
        <CodeViewerLight lang={lang} code={code} copyable={copyable} />
      )}
    </div>
  );
};

export default HighlightCode;
