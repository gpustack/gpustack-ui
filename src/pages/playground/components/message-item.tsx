import CopyButton from '@/components/copy-button';
import HotKeys from '@/config/hotkeys';
import { MinusCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space } from 'antd';
import { memo, useEffect, useRef, useState } from 'react';
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
  const [roleType, setRoleType] = useState(message.role);
  const [isTyping, setIsTyping] = useState(false);
  const [messageContent, setMessageContent] = useState(message.content);
  const isInitialRender = useRef(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentIsFocus, setCurrentIsFocus] = useState(isFocus);
  const inputRef = useRef<any>(null);

  useHotkeys(
    HotKeys.SUBMIT,
    () => {
      onSubmit();
    },
    {
      enabled: currentIsFocus && !loading,
      enableOnFormTags: currentIsFocus && !loading,
      preventDefault: true
    }
  );

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

  useEffect(() => {
    setMessageContent(message.content);
  }, [message.content]);

  useEffect(() => {
    if (!isInitialRender.current) {
      updateMessage({
        role: roleType,
        content: messageContent,
        uid: message.uid
      });
    } else {
      isInitialRender.current = false;
    }
  }, [roleType, messageContent]);

  const handleMessageChange = (e: any) => {
    setIsTyping(true);
    setMessageContent(e.target.value);
  };

  const handleBlur = () => {
    setIsTyping(true);
    setCurrentIsFocus(false);
  };

  const handleFocus = () => {
    setCurrentIsFocus(true);
  };

  const handleRoleChange = () => {
    setRoleType((prevRoleType) => {
      const newRoleType =
        prevRoleType === Roles.User ? Roles.Assistant : Roles.User;
      return newRoleType;
    });
  };

  const handleDelete = () => {
    onDelete();
  };
  return (
    <div className="message-item">
      <div className="role-type">
        <Button onClick={handleRoleChange} type="text">
          {intl.formatMessage({ id: `playground.${roleType}` })}
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
          onFocus={handleFocus}
          onBlur={handleBlur}
        ></Input.TextArea>
      </div>
      <div className="delete-btn">
        <Space size={5}>
          {messageContent && (
            <CopyButton text={messageContent} size="small"></CopyButton>
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

export default memo(MessageItem);
