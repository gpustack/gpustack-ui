import IconFont from '@/components/icon-font';
import HotKeys from '@/config/hotkeys';
import { platformCall } from '@/utils';
import {
  ClearOutlined,
  ControlOutlined,
  EnterOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Divider, Input, Select, Tooltip } from 'antd';
import _ from 'lodash';
import { useCallback, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Roles } from '../config';
import { MessageItem } from '../config/types';
import '../style/message-input.less';
import PromptModal from './prompt-modal';
import ThumbImg from './thumb-img';
import UploadImg from './upload-img';

type CurrentMessage = Omit<MessageItem, 'uid'>;

const layoutOptions = [
  {
    label: '2 columns',
    icon: 'icon-cols_2',
    value: {
      span: 12,
      count: 2
    },
    tips: 'playground.toolbar.compare2Model'
  },
  {
    label: '3 columns',
    icon: 'icon-cols_3',
    value: {
      span: 8,
      count: 3
    },
    tips: 'playground.toolbar.compare3Model'
  },
  {
    label: '4 columns',
    icon: 'icon-cols_4',
    value: {
      span: 12,
      count: 4
    },
    tips: 'playground.toolbar.compare4Model'
  },
  {
    label: '6 columns',
    icon: 'icon-cols_6',
    value: {
      span: 8,
      count: 6
    },
    tips: 'playground.toolbar.compare6Model'
  }
];

interface MessageInputProps {
  modelList: Global.BaseOption<string>[];
  handleSubmit: (params: CurrentMessage) => void;
  handleAbortFetch: () => void;
  updateLayout?: (value: { span: number; count: number }) => void;
  clearAll: () => void;
  setModelSelections: (
    modelList: (Global.BaseOption<string> & {
      instanceId: symbol;
    })[]
  ) => void;
  presetPrompt: (list: CurrentMessage[]) => void;
  addMessage: (message: CurrentMessage) => void;
  loading: boolean;
  showModelSelection?: boolean;
  disabled: boolean;
  isEmpty?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  handleSubmit,
  handleAbortFetch,
  setModelSelections,
  presetPrompt,
  clearAll,
  updateLayout,
  addMessage,
  loading,
  modelList,
  showModelSelection,
  disabled,
  isEmpty
}) => {
  const { TextArea } = Input;
  const intl = useIntl();
  const platform = platformCall();
  // const [disabled, setDisabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<CurrentMessage>({
    role: Roles.User,
    content: '',
    imgs: []
  });
  const imgCountRef = useRef(0);

  const resetMessage = () => {
    setMessage({
      role: message.role,
      content: '',
      imgs: []
    });
  };

  const handleInputChange = (value: string) => {
    console.log('input change:', value);
    setMessage({
      ...message,
      content: value
    });
  };
  const handleSendMessage = () => {
    handleSubmit({ ...message });
    resetMessage();
  };
  const onStop = () => {
    // setDisabled(false);
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
    resetMessage();
  };

  const getPasteContent = useCallback(async (event: any) => {
    const clipboardData = event.clipboardData || window.clipboardData;
    const items = clipboardData.items;
    const imgPromises: Promise<string>[] = [];

    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      console.log('item===========', item);

      if (item.kind === 'file' && item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        const imgPromise = new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = function (event) {
            const base64String = event.target?.result as string;
            if (base64String) {
              resolve(base64String);
            } else {
              reject('Failed to convert image to base64');
            }
          };
          reader.readAsDataURL(file);
        });
        imgPromises.push(imgPromise);
      } else if (item.kind === 'string') {
        // string
      }
    }

    try {
      const imgs = await Promise.all(imgPromises);
      if (imgs.length) {
        const list = _.map(imgs, (img: string) => {
          imgCountRef.current += 1;
          return {
            uid: imgCountRef.current,
            dataUrl: img
          };
        });
        // setImgList((pre) => {
        //   return [...pre, ...list];
        // });
        setMessage({
          ...message,
          imgs: [...(message.imgs || []), ...list]
        });
      }
    } catch (error) {
      console.error('Error processing images:', error);
    }
  }, []);

  // ========== upload image ==========
  const handleUpdateImgList = (
    list: { uid: number | string; dataUrl: string }[]
  ) => {
    setMessage({
      ...message,
      imgs: [...(message.imgs || []), ...list]
    });
  };

  const handleDeleteImg = (uid: number | string) => {
    const list = _.filter(
      message.imgs,
      (item: MessageItem) => item.uid !== uid
    );
    setMessage({
      ...message,
      imgs: list
    });
  };

  const handleOnPaste = (e: any) => {
    const text = e.clipboardData.getData('text');
    if (text) {
      setMessage?.({
        ...message,
        content: text
      });
    } else {
      getPasteContent(e);
    }
  };

  const handleDeleteLastImage = useCallback(() => {
    if (message.imgs && message.imgs?.length > 0) {
      const newImgList = [...(message.imgs || [])];
      const lastImage = newImgList.pop();
      if (lastImage) {
        handleDeleteImg(lastImage.uid);
      }
    }
  }, [message.imgs, handleDeleteImg]);

  const handleKeyDown = useCallback(
    (event: any) => {
      if (
        event.key === 'Backspace' &&
        message.content === '' &&
        message.imgs &&
        message.imgs?.length > 0
      ) {
        // inputref blur
        event.preventDefault();
        handleDeleteLastImage();
      }
    },
    [message, handleDeleteLastImage]
  );

  useHotkeys(
    HotKeys.SUBMIT.join(','),
    () => {
      console.log('submit message', loading);
      handleSendMessage();
    },
    { enabled: true }
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
          <UploadImg handleUpdateImgList={handleUpdateImgList}></UploadImg>
          <Tooltip
            title={intl.formatMessage({ id: 'playground.toolbar.clearmsg' })}
          >
            <Button
              type="text"
              icon={<ClearOutlined />}
              size="middle"
              onClick={handleClearAll}
            ></Button>
          </Tooltip>

          <Tooltip
            title={intl.formatMessage({ id: 'playground.toolbar.prompts' })}
          >
            <Button
              type="text"
              icon={<ControlOutlined />}
              size="middle"
              onClick={handleOpenPrompt}
            ></Button>
          </Tooltip>
          {updateLayout && (
            <>
              <Divider type="vertical" style={{ margin: 0 }} />
              {layoutOptions.map((option) => (
                <Tooltip
                  title={intl.formatMessage({ id: option.tips })}
                  key={option.icon}
                >
                  <Button
                    key={option.icon}
                    type="text"
                    icon={<IconFont type={option.icon}></IconFont>}
                    size="middle"
                    onClick={() => handleLayoutChange(option.value)}
                  ></Button>
                </Tooltip>
              ))}
            </>
          )}
        </div>
        <div className="actions">
          {showModelSelection && (
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
          )}

          <Button type="default" size="middle" onClick={handleAddMessage}>
            {intl.formatMessage({ id: 'common.button.add' })}
          </Button>
          {!loading ? (
            <Button
              type="primary"
              onClick={handleSendMessage}
              size="middle"
              disabled={disabled ? true : !message.content && isEmpty}
            >
              {intl.formatMessage({ id: 'common.button.submit' })}
              <span className="m-l-5 opct-7">
                {platform.isMac ? (
                  <>
                    <IconFont type="icon-command"></IconFont> +{' '}
                    <EnterOutlined />
                  </>
                ) : (
                  <>
                    CTRL + <EnterOutlined />
                  </>
                )}
              </span>
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
      <ThumbImg
        dataList={message.imgs || []}
        onDelete={handleDeleteImg}
      ></ThumbImg>
      <TextArea
        placeholder="Type your message here"
        autoSize={{ minRows: 3, maxRows: 3 }}
        onChange={(e) => handleInputChange(e.target.value)}
        value={message.content}
        size="large"
        variant="borderless"
        onKeyDown={handleKeyDown}
        onPaste={handleOnPaste}
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
