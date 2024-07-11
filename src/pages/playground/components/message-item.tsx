import CopyButton from '@/components/copy-button';
import HotKeys from '@/config/hotkeys';
import { MinusCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Roles } from '../config';
import '../style/message-item.less';
interface MessageItemProps {
  role: string;
  content: string;
  uid: number;
}

const MessageItem: React.FC<{
  message: MessageItemProps;
  loading?: boolean;
  islast?: boolean;
  onSubmit: () => void;
  updateMessage: (message: MessageItemProps) => void;
  isFocus: boolean;
  onDelete: () => void;
}> = ({ message, isFocus, onDelete, updateMessage, onSubmit, loading }) => {
  const intl = useIntl();
  const [isTyping, setIsTyping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentIsFocus, setCurrentIsFocus] = useState(isFocus);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (inputRef.current && isFocus) {
      inputRef.current.focus();
    }
  }, [isFocus]);

  // useEffect(() => {
  //   if (isTyping) return;
  //   let index = 0;
  //   const text = message.content;
  //   if (!text.length) {
  //     return;
  //   }
  //   setMessageContent('');
  //   setIsAnimating(true);
  //   const intervalId = setInterval(() => {
  //     setMessageContent((prev) => prev + text[index]);
  //     index += 1;
  //     if (index === text.length) {
  //       setIsAnimating(false);
  //       clearInterval(intervalId);
  //     }
  //   }, 20);
  //   return () => clearInterval(intervalId);
  // }, [message.content, isTyping]);

  const handleUpdateMessage = (params: { role: string; message: string }) => {
    updateMessage({
      role: params.role,
      content: params.message,
      uid: message.uid
    });
  };
  const handleMessageChange = (e: any) => {
    // setIsTyping(true);
    handleUpdateMessage({ role: message.role, message: e.target.value });
  };

  const handleBlur = () => {
    // setIsTyping(true);
    setCurrentIsFocus(false);
  };

  const handleFocus = () => {
    setCurrentIsFocus(true);
  };

  const handleRoleChange = () => {
    const newRoleType =
      message.role === Roles.User ? Roles.Assistant : Roles.User;

    handleUpdateMessage({ role: newRoleType, message: message.content });
  };

  const handleDelete = () => {
    onDelete();
  };

  useHotkeys(
    HotKeys.SUBMIT,
    () => {
      inputRef.current.blur();
      onSubmit();
    },
    {
      enabled: currentIsFocus,
      enableOnFormTags: currentIsFocus,
      preventDefault: true
    }
  );

  return (
    <div className="message-item">
      <div className="role-type">
        <Button onClick={handleRoleChange} type="text">
          {intl.formatMessage({ id: `playground.${message.role}` })}
        </Button>
      </div>
      <div className="message-content-input">
        <Input.TextArea
          ref={inputRef}
          style={{ paddingBlock: '12px' }}
          value={message.content}
          autoSize={true}
          variant="filled"
          readOnly={loading}
          onChange={handleMessageChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        ></Input.TextArea>
      </div>
      <div className="delete-btn">
        <Space size={5}>
          {message.content && (
            <CopyButton text={message.content} size="small"></CopyButton>
          )}
          <Button
            type="text"
            shape="circle"
            size="small"
            style={{ color: 'var(--ant-color-primary)' }}
            onClick={handleDelete}
            icon={<MinusCircleOutlined />}
          ></Button>
        </Space>
      </div>
    </div>
  );
};

export default MessageItem;
