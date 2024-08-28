import { marked, Tokens } from 'marked';
import React from 'react';

interface MarkdownViewerProps {
  content: string;
  height?: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  height = 'auto'
}) => {
  const renderer = new marked.Renderer();

  renderer.link = ({ href, title, text }: Tokens.Link) => {
    return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  return (
    <div style={{ height, overflow: 'auto' }}>
      <div
        dangerouslySetInnerHTML={{ __html: marked(content, { renderer }) }}
      />
    </div>
  );
};

export default React.memo(MarkdownViewer);
