import { PageContainer } from '@ant-design/pro-components';
import { useState } from 'react';
import '../style/ground-left.less';
import ChatFooter from './chat-footer';
import MessageItem from './message-item';
import ReferenceParams from './reference-params';
import ViewCodeModal from './view-code-modal';

const MessageList: React.FC = () => {
  const [messageList, setMessageList] = useState<any[]>([
    {
      role: 'User',
      message: 'hello'
    },
    {
      role: 'Assistant',
      message: 'hello, nice to meet you!'
    }
  ]);
  const [show, setShow] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleNewMessage = () => {
    console.log('new message');
    messageList.push({
      role: 'User',
      message: 'hello'
    });
    setMessageList([...messageList]);
    setActiveIndex(messageList.length - 1);
  };

  const handleClear = () => {
    console.log('clear');
  };

  const handleView = () => {
    setShow(true);
  };

  const handleSubmit = () => {
    console.log('submit');
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const handleDelete = (index: number) => {
    messageList.splice(index, 1);
    setMessageList([...messageList]);
  };

  return (
    <div className="ground-left">
      <PageContainer title={false} className="message-list-wrap">
        <div>
          {messageList.map((item, index) => {
            return (
              <MessageItem
                key={index}
                role={item.role}
                isFocus={index === activeIndex}
                onDelete={() => handleDelete(index)}
                message={item.message}
              />
            );
          })}
        </div>
      </PageContainer>
      <div className="ground-left-footer">
        <ChatFooter
          onClear={handleClear}
          onNewMessage={handleNewMessage}
          onSubmit={handleSubmit}
          onView={handleView}
          feedback={<ReferenceParams></ReferenceParams>}
        ></ChatFooter>
      </div>
      <ViewCodeModal
        open={show}
        onCancel={handleCloseViewCode}
        title="View code"
      ></ViewCodeModal>
    </div>
  );
};

export default MessageList;
