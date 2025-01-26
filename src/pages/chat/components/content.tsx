import React from 'react';
import '../styles/content.less';

interface ContentProps {
  children: React.ReactNode;
}

const Content: React.FC<ContentProps> = ({ children }) => {
  return (
    <div className="chat-content">
      <div className="content">{children}</div>
    </div>
  );
};

export default React.memo(Content);
