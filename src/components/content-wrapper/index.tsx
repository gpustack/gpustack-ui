import React from 'react';
import './index.less';

const ContentWrapper: React.FC<{
  children: React.ReactNode;
  title: React.ReactNode;
  titleStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}> = ({ children, title = false, titleStyle, contentStyle }) => {
  return (
    <div className="content-wrapper">
      {title && (
        <div className="title" style={{ ...titleStyle }}>
          {title}
        </div>
      )}
      <div className="content" style={{ ...contentStyle }}>
        {children}
      </div>
    </div>
  );
};

export default ContentWrapper;
