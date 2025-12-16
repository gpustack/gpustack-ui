import React from 'react';
import 'simplebar-react/dist/simplebar.min.css';
import { MessageItem, MessageItemAction } from '../../config/types';
import ContentItem from './content-item';

interface MessageContentProps {
  loading?: boolean;
  actions?: MessageItemAction[];
  editable?: boolean;
  showTitle?: boolean;
  messageList: MessageItem[];
  setMessageList?: (list: any) => void;
}

const MessageContent: React.FC<MessageContentProps> = ({
  setMessageList,
  messageList,
  editable,
  showTitle = true,
  loading,
  actions = ['upload', 'delete', 'copy']
}) => {
  const updateMessage = (index: number, message: MessageItem) => {
    const newMessageList = [...messageList];
    newMessageList[index] = message;
    setMessageList?.(newMessageList);
  };

  const handleDelete = (index: number) => {
    const newMessageList = [...messageList];
    newMessageList.splice(index, 1);
    setMessageList?.(newMessageList);
  };

  return (
    <>
      {!!messageList.length && (
        <div className="message-content-list">
          {messageList.map((item, index) => (
            <ContentItem
              loading={loading}
              key={item.uid}
              data={item}
              editable={editable}
              actions={actions}
              showTitle={showTitle}
              onDelete={() => handleDelete(index)}
              updateMessage={(data) => updateMessage(index, data)}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default MessageContent;
