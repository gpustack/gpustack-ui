import FullMarkdown from '@/components/markdown-viewer/full-markdown';
import React from 'react';
import '../../style/think-content.less';

interface ThinkContentProps {
  content: string;
  isThinking?: boolean;
  collapsed?: boolean;
}

const ThinkContent: React.FC<ThinkContentProps> = ({ content, collapsed }) => {
  return (
    <>
      {content ? (
        <div className="think-wrapper">
          {!collapsed && (
            <div className="think-content">
              <FullMarkdown content={content}></FullMarkdown>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
};

export default ThinkContent;
