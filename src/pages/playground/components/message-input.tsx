import IconFont from '@/components/icon-font';
import HotKeys from '@/config/hotkeys';
import { platformCall } from '@/utils';
import {
  ClearOutlined,
  ControlOutlined,
  PictureOutlined,
  SendOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Select } from 'antd';
import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import '../style/message-input.less';

const layoutOptions = [
  {
    label: '2 columns',
    icon: 'icon-cols_2',
    value: {
      span: 12,
      count: 2
    },
    tips: 'two models compare'
  },
  {
    label: '3 columns',
    icon: 'icon-cols_3',
    value: {
      span: 8,
      count: 3
    },
    tips: 'three models compare'
  },
  {
    label: '4 columns',
    icon: 'icon-cols_4',
    value: {
      span: 6,
      count: 4
    },
    tips: 'four models compare'
  },
  {
    label: '6 columns',
    icon: 'icon-cols_6',
    value: {
      span: 8,
      count: 6
    },
    tips: 'six models compare'
  }
];

interface MessageInputProps {
  modelList: Global.BaseOption<string>[];
  handleSubmit: (value: string) => void;
  handleAbortFetch: () => void;
  setParamsSettings: (value: Record<string, any>) => void;
  setSpans: (value: { span: number; count: number }) => void;
  loading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  handleSubmit,
  handleAbortFetch,
  setParamsSettings,
  loading,
  modelList,
  setSpans
}) => {
  const { TextArea } = Input;
  const intl = useIntl();
  const platform = platformCall();
  const [disabled, setDisabled] = useState(false);
  const [message, setMessage] = useState('');
  const handleInputChange = (value: string) => {
    setMessage(value);
  };
  const handleSendMessage = () => {
    handleSubmit(message);
  };
  const onStop = () => {
    setDisabled(false);
    handleAbortFetch();
  };
  const handleLayoutChange = (value: { span: number; count: number }) => {
    console.log('layout change:', value);
    setSpans(value);
  };
  useHotkeys(
    HotKeys.SUBMIT.join(','),
    () => {
      handleSendMessage();
    },
    { preventDefault: true }
  );
  return (
    <div className="messageInput">
      <div className="tool-bar">
        <div className="actions">
          <Button type="text" icon={<PictureOutlined />} size="middle"></Button>
          <Button type="text" icon={<ClearOutlined />} size="middle"></Button>
          <Button type="text" icon={<ControlOutlined />} size="middle"></Button>

          {layoutOptions.map((option) => (
            <Button
              key={option.icon}
              type="text"
              icon={<IconFont type={option.icon}></IconFont>}
              size="middle"
              onClick={() => handleLayoutChange(option.value)}
            ></Button>
          ))}
        </div>
        <div className="actions">
          <Select
            variant="borderless"
            style={{ width: 200 }}
            placeholder="select models"
            options={modelList}
            mode="multiple"
            maxCount={6}
            maxTagCount={0}
            maxTagTextLength={15}
          ></Select>
          {!loading ? (
            <Button type="primary" onClick={handleSendMessage} size="middle">
              <SendOutlined />
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={onStop}
              size="middle"
              icon={<IconFont type="icon-stop1"></IconFont>}
            ></Button>
          )}
        </div>
      </div>
      <TextArea
        placeholder="Send your message"
        autoSize={{ minRows: 3, maxRows: 3 }}
        onChange={(e) => handleInputChange(e.target.value)}
        value={message}
        size="large"
        variant="borderless"
      ></TextArea>
    </div>
  );
};

export default MessageInput;
