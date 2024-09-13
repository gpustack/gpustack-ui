import IconFont from '@/components/icon-font';
import HotKeys from '@/config/hotkeys';
import { platformCall } from '@/utils';
import {
  ClearOutlined,
  ControlOutlined,
  PictureOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Divider, Input, Select } from 'antd';
import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Roles } from '../config';
import '../style/message-input.less';
import PromptModal from './prompt-modal';

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
      span: 12,
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
  handleSubmit: (params: { role: string; content: string }) => void;
  handleAbortFetch: () => void;
  updateLayout?: (value: { span: number; count: number }) => void;
  clearAll: () => void;
  setModelSelections: (
    modelList: (Global.BaseOption<string> & {
      instanceId: symbol;
    })[]
  ) => void;
  presetPrompt: (list: { role: string; content: string }[]) => void;
  addMessage: (message: { role: string; content: string }) => void;
  loading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  handleSubmit,
  handleAbortFetch,
  setModelSelections,
  presetPrompt,
  loading,
  modelList,
  clearAll,
  updateLayout,
  addMessage
}) => {
  const { TextArea } = Input;
  const intl = useIntl();
  const platform = platformCall();
  const [disabled, setDisabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ role: string; content: string }>({
    role: Roles.User,
    content: ''
  });
  const handleInputChange = (value: string) => {
    console.log('input change:', value);
    setMessage({
      ...message,
      content: value
    });
  };
  const handleSendMessage = () => {
    handleSubmit({ ...message });
    setMessage({
      ...message,
      content: ''
    });
  };
  const onStop = () => {
    setDisabled(false);
    handleAbortFetch();
  };
  const handleLayoutChange = (value: { span: number; count: number }) => {
    console.log('layout change:', value);
    updateLayout?.(value);
  };

  const handleToggleRole = () => {
    setMessage({
      ...message,
      role: message.role === Roles.User ? Roles.Assistant : Roles.User
    });
  };

  const handleClearAll = (e: any) => {
    e.stopPropagation();
    clearAll();
  };

  const handleUpdateModelSelections = (value: string[]) => {
    console.log('update model selections:', value);
    const list = value?.map?.((val) => {
      return {
        value: val,
        label: val,
        instanceId: Symbol(val)
      };
    });
    setModelSelections(list);
  };

  const handleOpenPrompt = () => {
    setOpen(true);
  };

  const handleAddMessage = () => {
    console.log('add message');
    addMessage({ ...message });
    setMessage({
      ...message,
      content: ''
    });
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
          <Button
            type="text"
            size="middle"
            onClick={handleToggleRole}
            icon={<SwapOutlined rotate={90} />}
          >
            {intl.formatMessage({ id: `playground.${message.role}` })}
          </Button>
          <Divider type="vertical" style={{ margin: 0 }} />
          <Button type="text" icon={<PictureOutlined />} size="middle"></Button>
          <Button
            type="text"
            icon={<ClearOutlined />}
            size="middle"
            onClick={handleClearAll}
          ></Button>
          <Button
            type="text"
            icon={<ControlOutlined />}
            size="middle"
            onClick={handleOpenPrompt}
          ></Button>
          {updateLayout && (
            <>
              <Divider type="vertical" style={{ margin: 0 }} />
              {layoutOptions.map((option) => (
                <Button
                  key={option.icon}
                  type="text"
                  icon={<IconFont type={option.icon}></IconFont>}
                  size="middle"
                  onClick={() => handleLayoutChange(option.value)}
                ></Button>
              ))}
            </>
          )}
        </div>
        <div className="actions">
          <Select
            variant="borderless"
            style={{ width: 180 }}
            placeholder="select models"
            options={modelList}
            mode="multiple"
            maxCount={6}
            maxTagCount={0}
            maxTagTextLength={15}
            onChange={handleUpdateModelSelections}
          ></Select>
          <Button type="default" size="middle" onClick={handleAddMessage}>
            {intl.formatMessage({ id: 'common.button.add' })}
          </Button>
          {!loading ? (
            <Button type="primary" onClick={handleSendMessage} size="middle">
              {intl.formatMessage({ id: 'common.button.submit' })}
            </Button>
          ) : (
            <Button
              style={{ width: 44 }}
              type="primary"
              onClick={onStop}
              size="middle"
              icon={<IconFont type="icon-stop1"></IconFont>}
            ></Button>
          )}
        </div>
      </div>
      <TextArea
        placeholder="Type your message here"
        autoSize={{ minRows: 3, maxRows: 3 }}
        onChange={(e) => handleInputChange(e.target.value)}
        value={message.content}
        size="large"
        variant="borderless"
      ></TextArea>
      <PromptModal
        open={open}
        onCancel={() => setOpen(false)}
        onSelect={presetPrompt}
      ></PromptModal>
    </div>
  );
};

export default MessageInput;
