import { Spin } from 'antd';
import React, { useMemo } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import ContentItem from './content-item';

interface MessageContentProps {
  loading: boolean;
  spans: {
    span: number;
    count: number;
  };
  messageList: {
    role: string;
    uid?: any;
    content: string;
  }[];
}

const MessageContent: React.FC<MessageContentProps> = ({
  messageList,
  spans,
  loading
}) => {
  const maxHeight = useMemo(() => {
    const total = 72 + 110 + 46 + 16 + 32;
    if (spans.span < 4) {
      return `calc(100vh - ${total}px)`;
    }
    return `calc(100vh - ${total * 2 + 16}px)`;
  }, [spans.span]);
  return (
    <>
      {messageList.length ? (
        <SimpleBar style={{ maxHeight: 'calc(100% - 46px)' }}>
          <div className="message-content-list">
            {messageList.map((item, index) => (
              <ContentItem key={index} data={item} />
            ))}
          </div>
        </SimpleBar>
      ) : (
        <span>{loading}</span>
      )}
      <Spin spinning={!!loading} size="small" style={{ width: '100%' }} />
    </>
  );
};

export default React.memo(MessageContent);
