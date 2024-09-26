import { EyeOutlined } from '@ant-design/icons';
import { Image, Typography } from 'antd';
import { unescape } from 'lodash';
import { TokensList, marked } from 'marked';
import React, { Fragment, useCallback } from 'react';
import HighlightCode from '../highlight-code';
import './index.less';

const { Text, Link, Paragraph } = Typography;

interface MarkdownViewerProps {
  content: string;
  height?: string;
  theme?: 'light' | 'dark';
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
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
    'escape'
  ];

  const renderItem = useCallback((token: any, render: any) => {
    if (!reDefineTypes.includes(token.type)) {
      console.log('token======66==', token.type, token);
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

    if (token.type === 'br') {
      htmlstr = <br />;
    }

    if (token.type === 'em') {
      htmlstr = <em>{text}</em>;
    }

    if (token.type === 'image') {
      htmlstr = (
        <Image
          src={token.href}
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
  }, []);
  const renderTokens = (tokens: TokensList): any => {
    return tokens?.map((token: any, index: number) => {
      return <Fragment key={index}>{renderItem(token, renderTokens)}</Fragment>;
    });
  };

  return (
    <div
      style={{ height, overflow: 'auto' }}
      className="markdown-viewer custom-scrollbar-horizontal"
    >
      {renderTokens(tokens)}
    </div>
  );
};

export default React.memo(MarkdownViewer);
