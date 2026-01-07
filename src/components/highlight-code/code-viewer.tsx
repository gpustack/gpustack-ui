import classNames from 'classnames';
import hljs from 'highlight.js';
import { useMemo } from 'react';
import styled from 'styled-components';
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
  xScrollable?: boolean;
}

interface CodeHeaderProps {
  copyValue: string;
  copyable: boolean;
  lang: string;
  theme: 'light' | 'dark';
}

const CodeHeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  color: var(--ant-color-text-tertiary);
  background-color: #fafafa;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  &.dark {
    background-color: var(--color-editor-header-bg);
    color: rgba(255, 255, 255, 0.65);
  }
`;

const Wrapper = styled.div`
  border-radius: var(--border-radius-mini);
  &:hover {
    .custome-scrollbar {
      &::-webkit-scrollbar-thumb {
        background-color: var(--color-scrollbar-thumb);
        border-radius: 4px;
      }
    }
  }
`;

const CodeHeader: React.FC<CodeHeaderProps> = ({
  copyValue,
  lang,
  theme,
  copyable
}) => {
  if (!copyable) {
    return null;
  }
  return (
    <CodeHeaderWrapper
      className={classNames({
        dark: theme === 'dark',
        light: theme === 'light'
      })}
    >
      <span>{lang}</span>
      <CopyButton
        text={copyValue}
        size="small"
        style={{ color: '#abb2bf' }}
      ></CopyButton>
    </CodeHeaderWrapper>
  );
};

const CodeViewer: React.FC<CodeViewerProps> = (props) => {
  const {
    code = '',
    copyValue,
    lang,
    autodetect = true,
    ignoreIllegals = true,
    copyable = true,
    height = 'auto',
    style,
    xScrollable = false
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
    <Wrapper>
      <CodeHeader
        copyValue={copyValue || code}
        lang={lang}
        copyable={copyable}
        theme={props.theme || 'light'}
      ></CodeHeader>
      <pre
        className={classNames(
          'code-pre custome-scrollbar custom-scrollbar-horizontal ',
          {
            dark: props.theme === 'dark',
            light: props.theme === 'light',
            'x-scrollable': xScrollable
          }
        )}
        style={{
          marginBottom: 0,
          height: height,
          ...style
        }}
      >
        <code
          style={{
            minHeight: height,
            ...(xScrollable ? { width: 'max-content' } : {})
          }}
          className={classNames(highlightedCode.className, {
            dark: props.theme === 'dark',
            light: props.theme === 'light'
          })}
          dangerouslySetInnerHTML={{
            __html: highlightedCode.value
          }}
        ></code>
      </pre>
    </Wrapper>
  );
};

export default CodeViewer;
