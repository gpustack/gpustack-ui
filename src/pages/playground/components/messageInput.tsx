import { SendOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { useState } from 'react';
import '../style/message-input.less';

const MessageInput: React.FC = () => {
  const { TextArea } = Input;
  const [message, setMessage] = useState('');
  const handleInputChange = (value: string) => {
    setMessage(value);
  };
  const handleSendMessage = () => {
    console.log('send message:', message);
  };
  const SendButton: React.FC = () => {
    return (
      <Button
        type="primary"
        shape="circle"
        size="middle"
        icon={<SendOutlined />}
        onClick={() => handleSendMessage()}
      ></Button>
    );
  };
  return (
    <div className="messageInput">
      <TextArea
        placeholder="send your message"
        autoSize={{ minRows: 1, maxRows: 6 }}
        onChange={(e) => handleInputChange(e.target.value)}
        value={message}
        size="large"
        variant="borderless"
      ></TextArea>
      <span className="send-btn">
        <SendButton />
      </span>
    </div>
  );
};

export default MessageInput;
