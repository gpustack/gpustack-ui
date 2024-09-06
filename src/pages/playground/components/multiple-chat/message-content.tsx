import React from 'react';
import ContentItem from './content-item';

interface MessageContentProps {
  messageList: {
    role: string;
    uid?: string;
    content: string;
  }[];
}

const MessageContent: React.FC<MessageContentProps> = ({ messageList }) => {
  return (
    <div>
      {messageList.map((item, index) => (
        <ContentItem key={index} data={item} />
      ))}
    </div>
  );
};

export default React.memo(MessageContent);
