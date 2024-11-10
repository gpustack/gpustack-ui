import IconFont from '@/components/icon-font';
import HotKeys, { KeyMap } from '@/config/hotkeys';
import { ClearOutlined, SendOutlined, SwapOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Divider, Input, Select, Tooltip } from 'antd';
import _ from 'lodash';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Roles } from '../config';
import { MessageItem } from '../config/types';
import '../style/message-input.less';
import PromptModal from './prompt-modal';
import ThumbImg from './thumb-img';
import UploadImg from './upload-img';

type CurrentMessage = Omit<MessageItem, 'uid'>;

type ActionType = 'clear' | 'layout' | 'role' | 'upload' | 'add' | 'paste';

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
  setModelSelections?: (
    modelList: (Global.BaseOption<string> & {
      instanceId: symbol;
    })[]
  ) => void;
  submitIcon?: React.ReactNode;
  presetPrompt?: (list: CurrentMessage[]) => void;
  addMessage?: (message: CurrentMessage) => void;
  tools?: React.ReactNode;
  loading: boolean;
  showModelSelection?: boolean;
  disabled: boolean;
  isEmpty?: boolean;
  scope: string;
  placeholer?: string;
  shouldResetMessage?: boolean;
  style?: React.CSSProperties;
  actions?: ActionType[];
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
  isEmpty,
  scope,
  submitIcon,
  placeholer,
  tools,
  style,
  shouldResetMessage = true,
  actions = ['clear', 'layout', 'role', 'upload', 'add', 'paste']
}) => {
  const { TextArea } = Input;
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [message, setMessage] = useState<CurrentMessage>({
    role: Roles.User,
    content: '',
    imgs: []
  });
  const imgCountRef = useRef(0);
  const inputRef = useRef<any>(null);

  const isDisabled = useMemo(() => {
    return disabled
      ? true
      : !message.content && isEmpty && !message.imgs?.length;
  }, [disabled, message, isEmpty]);

  const resetMessage = () => {
    setMessage({
      role: message.role,
      content: '',
      imgs: []
    });
  };

  const handleInputChange = (e: any) => {
    console.log('input change:', e.target?.value);
    setMessage({
      ...message,
      content: e.target?.value
    });
  };
  const handleSendMessage = () => {
    handleSubmit({ ...message });
    if (shouldResetMessage) {
      resetMessage();
    }
  };
  const onStop = () => {
    handleAbortFetch();
  };
  const handleLayoutChange = (value: { span: number; count: number }) => {
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
    const list = value?.map?.((val) => {
      return {
        value: val,
        label: val,
        instanceId: Symbol(val)
      };
    });
    setModelSelections?.(list);
  };

  const handleOpenPrompt = () => {
    setOpen(true);
  };

  const handleAddMessage = (e?: any) => {
    e?.preventDefault();
    addMessage?.({ ...message });
    resetMessage();
    setFocused(true);
    setTimeout(() => {
      inputRef.current?.focus?.();
    }, 100);
  };

  const getPasteContent = useCallback(
    async (event: any) => {
      const clipboardData = event.clipboardData || window.clipboardData;
      const items = clipboardData.items;
      const imgPromises: Promise<string>[] = [];

      for (let i = 0; i < items.length; i++) {
        let item = items[i];

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
          setMessage({
            ...message,
            imgs: [...(message.imgs || []), ...list]
          });
        }
      } catch (error) {
        console.error('Error processing images:', error);
      }
    },
    [message]
  );

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
    if (!text) {
      e.preventDefault();
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

  const handleSelectPrompt = (list: CurrentMessage[]) => {
    presetPrompt?.(list);
  };

  useHotkeys(
    HotKeys.SUBMIT,
    (e: any) => {
      console.log('submit message', loading);
      e.preventDefault();
      handleSendMessage();
    },
    {
      enabled: !loading && !isDisabled,
      enableOnFormTags: focused,
      preventDefault: true
    }
  );
  useHotkeys(
    HotKeys.ADD,
    (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      handleAddMessage();
    },
    {
      enabled: !loading,
      enableOnFormTags: focused,
      preventDefault: true
    }
  );

  useHotkeys(
    HotKeys.FOCUS,
    () => {
      inputRef.current?.focus?.({
        cursor: 'end'
      });
    },
    { preventDefault: true }
  );

  return (
    <div className="messageInput" style={{ ...style }}>
      <div className="tool-bar">
        <div className="actions">
          {tools}
          {
            <>
              {actions.includes('role') && (
                <>
                  <Button
                    type="text"
                    size="middle"
                    onClick={handleToggleRole}
                    icon={<SwapOutlined rotate={90} />}
                  >
                    {intl.formatMessage({ id: `playground.${message.role}` })}
                  </Button>
                  <Divider type="vertical" style={{ margin: 0 }} />
                </>
              )}
              {actions.includes('upload') && message.role === Roles.User && (
                <UploadImg
                  handleUpdateImgList={handleUpdateImgList}
                  size="middle"
                ></UploadImg>
              )}
            </>
          }
          {actions.includes('clear') && (
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
          )}
          {actions.includes('layout') && updateLayout && (
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

          {actions.includes('add') && (
            <Tooltip
              title={
                <span>
                  [{KeyMap.ADD.textKeybinding}]{' '}
                  {intl.formatMessage({ id: 'common.button.add' })}
                </span>
              }
            >
              <Button type="default" size="middle" onClick={handleAddMessage}>
                {intl.formatMessage({ id: 'common.button.add' })}
              </Button>
            </Tooltip>
          )}
          {!loading ? (
            <Tooltip
              title={
                <span>
                  [{KeyMap.SUBMIT.textKeybinding}]{' '}
                  {intl.formatMessage({ id: 'common.button.submit' })}
                </span>
              }
            >
              <Button
                style={{ width: 46 }}
                type="primary"
                onClick={handleSendMessage}
                size="middle"
                disabled={isDisabled}
              >
                {submitIcon ?? (
                  <SendOutlined rotate={0} className="font-size-14" />
                )}
              </Button>
            </Tooltip>
          ) : (
            <Button
              style={{ width: 46 }}
              type="primary"
              onClick={onStop}
              size="middle"
              icon={
                <IconFont type="icon-stop1" className="font-size-14"></IconFont>
              }
            ></Button>
          )}
        </div>
      </div>
      <ThumbImg
        dataList={message.imgs || []}
        onDelete={handleDeleteImg}
      ></ThumbImg>
      <div className="input-box">
        {actions.includes('paste') ? (
          <TextArea
            ref={inputRef}
            autoSize={{ minRows: 3, maxRows: 8 }}
            onChange={handleInputChange}
            value={message.content}
            size="large"
            variant="borderless"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            onPaste={handleOnPaste}
          ></TextArea>
        ) : (
          <TextArea
            ref={inputRef}
            autoSize={{ minRows: 3, maxRows: 8 }}
            onChange={handleInputChange}
            value={message.content}
            size="large"
            variant="borderless"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
          ></TextArea>
        )}
        {!message.content && !focused && (
          <span
            className="holder"
            dangerouslySetInnerHTML={{
              __html:
                placeholer ??
                intl.formatMessage({ id: 'playground.input.holder' })
            }}
          ></span>
        )}
      </div>
      <PromptModal
        open={open}
        onCancel={() => setOpen(false)}
        onSelect={handleSelectPrompt}
      ></PromptModal>
    </div>
  );
};

export default MessageInput;
