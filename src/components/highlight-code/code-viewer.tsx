import classNames from 'classnames';
import hljs from 'highlight.js';
import { memo, useMemo } from 'react';
import CopyButton from '../copy-button';
import { escapeHtml } from './utils';

interface CodeViewerProps {
  code: string;
  copyValue?: string;
  lang: string;
  autodetect?: boolean;
  ignoreIllegals?: boolean;
  copyable?: boolean;
  height?: string | number;
  theme?: 'light' | 'dark';
  style?: React.CSSProperties;
}
const CodeViewer: React.FC<CodeViewerProps> = (props) => {
  const {
    code,
    copyValue,
    lang,
    autodetect = true,
    ignoreIllegals = true,
    copyable = true,
    height = 'auto',
    style
  } = props || {};

  const highlightedCode = useMemo(() => {
    const autodetectLang = autodetect && !lang;
    const cannotDetectLanguage = !autodetectLang && !hljs.getLanguage(lang);
    let className = '';

    if (!cannotDetectLanguage) {
      className = `hljs ${lang}`;
    }

    // No idea what language to use, return raw code
    if (cannotDetectLanguage) {
      console.warn(`The language "${lang}" you specified could not be found.`);
      return {
        value: escapeHtml(code),
        className: className
      };
    }

    if (autodetectLang) {
      const result = hljs.highlightAuto(code);
      return {
        value: result.value,
        className: className
      };
    }
    const result = hljs.highlight(code, {
      language: lang,
      ignoreIllegals: ignoreIllegals
    });
    return {
      value: result.value,
      className: className
    };
  }, [code, lang, autodetect, ignoreIllegals]);

  return (
    <pre
      className={classNames(
        'code-pre custome-scrollbar custom-scrollbar-horizontal ',
        {
          dark: props.theme === 'dark',
          light: props.theme === 'light',
          copyable: copyable
        }
      )}
      style={{
        height: height,
        ...style
      }}
    >
      <code
        style={{ minHeight: height }}
        className={classNames(highlightedCode.className, {
          dark: props.theme === 'dark',
          light: props.theme === 'light'
        })}
        dangerouslySetInnerHTML={{
          __html: highlightedCode.value
        }}
      ></code>
      {copyable && (
        <CopyButton
          text={copyValue || code}
          size="small"
          style={{ color: '#abb2bf' }}
        ></CopyButton>
      )}
    </pre>
  );
};

export default memo(CodeViewer);
