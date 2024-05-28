import { MinusCircleOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { Roles } from '../config';
import '../style/message-item.less';

const MessageContent: React.FC<{
  message: string;
  role: string;
  isFocus: boolean;
  onDelete: () => void;
}> = ({ message, role, isFocus, onDelete }) => {
  const [roleType, setRoleType] = useState(role);
  const [messageContent, setMessageContent] = useState(message);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (inputRef.current && isFocus) {
      inputRef.current.focus();
    }
  }, [isFocus]);

  const handleMessageChange = (e: any) => {
    setMessageContent(e.target.value);
  };

  const handleRoleChange = () => {
    if (roleType === Roles.User) {
      setRoleType(Roles.Assistant);
    }
    if (roleType === Roles.Assistant) {
      setRoleType(Roles.User);
    }
  };

  const handleDelete = () => {
    onDelete();
  };
  return (
    <div className="message-item">
      <div className="role-type">
        <Button onClick={handleRoleChange} type="text">
          {roleType}
        </Button>
      </div>
      <div className="message-content-input">
        <Input.TextArea
          ref={inputRef}
          style={{ paddingBlock: '12px' }}
          value={messageContent}
          autoSize={true}
          variant="filled"
          onChange={handleMessageChange}
        ></Input.TextArea>
      </div>
      <div className="delete-btn">
        <Button
          type="text"
          shape="circle"
          style={{ color: 'var(--ant-color-primary' }}
          onClick={handleDelete}
          icon={<MinusCircleOutlined />}
        ></Button>
      </div>
    </div>
  );
};

export default MessageContent;
