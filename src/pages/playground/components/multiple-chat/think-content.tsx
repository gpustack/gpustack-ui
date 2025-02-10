import IconFont from '@/components/icon-font';
import { Button } from 'antd';
import React from 'react';
import '../../style/think-content.less';

interface ThinkContentProps {
  content: string;
}

const ThinkContent: React.FC<ThinkContentProps> = ({ content }) => {
  return (
    <>
      {content ? (
        <div className="think-wrapper">
          <IconFont type="icon-AIzhineng" className="m-l-4" />
          <Button size="small" type="text">
            AI Thought...
          </Button>
          <div className="think-content">{content}</div>
        </div>
      ) : null}
    </>
  );
};

export default ThinkContent;
