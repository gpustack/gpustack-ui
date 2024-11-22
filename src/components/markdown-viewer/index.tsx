import { EyeOutlined } from '@ant-design/icons';
import { Checkbox, Image, Typography } from 'antd';
import { unescape } from 'lodash';
import { TokensList, marked } from 'marked';
import React, { Fragment, useCallback, useEffect } from 'react';
import HighlightCode from '../highlight-code';
import './index.less';

const { Text, Link, Paragraph } = Typography;

interface MarkdownViewerProps {
  content: string;
  height?: string;
  theme?: 'light' | 'dark';
  generateImgLink?: (src: string) => string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  generateImgLink,
  height = 'auto',
  theme = 'light'
}) => {
  const renderer = new marked.Renderer();
  const tokens = marked.lexer(content);
  const reDefineTypes = [
    'code',
    'link',
    'hr',
    'heading',
    'paragraph',
    'codespan',
    'strong',
    'text',
    'image',
    'em',
    'list',
    'list_item',
    'br',
    'html',
    'escape',
    'del',
    'blockquote',
    'checkbox'
    // 'bibtex'
  ];

  // renderer.link = ({ href, title, text }) => {
  //   return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  // };

  const isValidURL = useCallback((url: string) => {
    const pattern = /^(https?:\/\/|\/\/)([^\s/$.?#].[^\s]*)$/;

    return pattern.test(url);
  }, []);

  const generateImgSrc = useCallback(
    (src: string | null) => {
      if (!src) {
        return '';
      }
      if (generateImgLink) {
        return isValidURL(src) ? src : generateImgLink(src);
      }
      return src;
    },
    [generateImgLink]
  );

  const renderItem = useCallback(
    (token: any, render: any) => {
      console.log('token====', token);
      if (!reDefineTypes.includes(token.type)) {
        return (
          <span
            dangerouslySetInnerHTML={{
              __html: marked.parser([token], { renderer })
            }}
          ></span>
        );
      }
      let htmlstr: any = null;
      let child: any = null;
      if (token.tokens?.length) {
        child = render?.(token.tokens as TokensList, render);
      }
      const text = child ? child : unescape(token.text);

      if (token.type === 'escape') {
        htmlstr = text;
      }

      if (token.type === 'html') {
        htmlstr = <div dangerouslySetInnerHTML={{ __html: token.text }} />;
      }
      if (token.type === 'list') {
        htmlstr = token.order ? (
          <ol>{render?.(token.items, render)}</ol>
        ) : (
          <ul>{render?.(token.items, render)}</ul>
        );
      }

      if (token.type === 'list_item') {
        htmlstr = <li>{text}</li>;
      }

      if (token.type === 'del') {
        htmlstr = <del>{text}</del>;
      }

      if (token.type === 'blockquote') {
        htmlstr = <blockquote>{text}</blockquote>;
      }

      if (token.type === 'checkbox') {
        htmlstr = <Checkbox value={token.checked} />;
      }

      if (token.type === 'br') {
        htmlstr = <br />;
      }

      if (token.type === 'em') {
        htmlstr = <em>{text}</em>;
      }

      if (token.type === 'image') {
        let href = generateImgSrc(token.href);
        htmlstr = (
          <Image
            src={href}
            alt={token.text}
            preview={{
              mask: <EyeOutlined />
            }}
          />
        );
      }
      if (token.type === 'text') {
        htmlstr = text;
      }
      if (token.type === 'codespan') {
        htmlstr = <Text code>{text}</Text>;
      }
      if (token.type === 'strong') {
        htmlstr = <Text strong>{text}</Text>;
      }
      if (token.type === 'heading') {
        htmlstr = <Typography.Title level={4}>{text}</Typography.Title>;
      }
      if (token.type === 'paragraph') {
        htmlstr = <Paragraph> {text}</Paragraph>;
      }

      if (token.type === 'code') {
        htmlstr = (
          <HighlightCode theme={theme} code={token.text} lang={token.lang} />
        );
      }

      if (token.type === 'link') {
        htmlstr = (
          <Link
            href={token.href}
            title={token.title || ''}
            target="_blank"
            rel="noopener noreferrer"
          >
            {text}
          </Link>
        );
      }
      if (token.type === 'hr') {
        htmlstr = <hr className="hr" />;
      }

      return htmlstr;
    },
    [generateImgSrc]
  );
  const renderTokens = (tokens: TokensList): any => {
    return tokens?.map((token: any, index: number) => {
      return <Fragment key={index}>{renderItem(token, renderTokens)}</Fragment>;
    });
  };

  useEffect(() => {
    if (!content) {
      return;
    }
    const imgs = document.querySelectorAll('.markdown-viewer img');
    imgs.forEach((img) => {
      const src = img.getAttribute('src');
      img.setAttribute('src', generateImgSrc(src));
    });
  }, [content, generateImgSrc]);

  return (
    <>
      (
      <div
        style={{ height }}
        className="markdown-viewer custom-scrollbar-horizontal"
      >
        {renderTokens(tokens)}
      </div>
      )
    </>
  );
};

export default React.memo(MarkdownViewer);
