import SimpleAudio from '@/components/audio-player/simple-audio';
import IconFont from '@/components/icon-font';
import UploadAudio from '@/components/upload-audio';
import HotKeys, { KeyMap } from '@/config/hotkeys';
import {
  audioTypeMap,
  convertFileToBase64,
  readAudioFile
} from '@/utils/load-audio-file';
import {
  ClearOutlined,
  CustomerServiceOutlined,
  SendOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Divider, Input, Tooltip } from 'antd';
import _ from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import styled from 'styled-components';
import { Roles } from '../config';
import { AudioFormat, MessageItem } from '../config/types';
import useAddImage from '../hooks/use-add-image';
import '../style/message-input.less';
import ThumbImg from './thumb-img';

const AudioWrapper = styled.div`
  padding-block: 10px;
  height: max-content;
  width: max-content;
  audio {
    padding-top: 10px;
  }
`;

const ImgsWrapper = styled.div.attrs({
  className: 'custom-scrollbar-horizontal'
})`
  display: flex;
  overflow-x: auto;
  width: 100%;
  flex-direction: column;
`;

type CurrentMessage = Omit<MessageItem, 'uid'>;

type ActionType =
  | 'clear'
  | 'layout'
  | 'role'
  | 'upload'
  | 'add'
  | 'paste'
  | 'check';

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
  ref?: any;
  handleSubmit: (params: CurrentMessage) => void;
  handleAbortFetch: () => void;
  updateLayout?: (value: { span: number; count: number }) => void;
  clearAll: () => void;
  setModelSelections?: (
    modelList: (Global.BaseOption<string> & {
      instanceId: symbol;
    })[]
  ) => void;
  onCheck?: (e: any) => void;
  submitIcon?: React.ReactNode;
  addMessage?: (message: CurrentMessage) => void;
  onInputChange?: (e: any) => void;
  title?: React.ReactNode;
  tools?: React.ReactNode;
  loading: boolean;
  disabled: boolean;
  isEmpty?: boolean;
  placeholer?: string;
  shouldResetMessage?: boolean;
  style?: React.CSSProperties;
  actions?: ActionType[];
  checkLabel?: React.ReactNode;
  defaultChecked?: boolean;
  defaultSize?: { minRows: number; maxRows: number };
}

const MessageInput: React.FC<MessageInputProps> = forwardRef(
  (
    {
      handleSubmit,
      handleAbortFetch,
      clearAll,
      updateLayout,
      addMessage,
      onCheck,
      onInputChange,
      title,
      loading,
      disabled,
      isEmpty,
      submitIcon,
      placeholer,
      defaultChecked = true,
      tools,
      style,
      checkLabel,
      defaultSize = { minRows: 3, maxRows: 8 },
      shouldResetMessage = true,
      actions = ['clear', 'layout', 'role', 'upload', 'add', 'paste']
    },
    ref
  ) => {
    const { TextArea } = Input;
    const intl = useIntl();
    const [focused, setFocused] = useState(false);
    const [message, setMessage] = useState<CurrentMessage>({
      role: Roles.User,
      content: '',
      imgs: []
    });
    const [isFromUrl, setIsFromUrl] = useState(false);
    const [openImgTips, setOpenImgTips] = useState(false);
    const uidCountRef = useRef(0);
    const inputRef = useRef<any>(null);
    const inputImgRef = useRef<any>(null);

    const updateUidCount = () => {
      uidCountRef.current += 1;
      return uidCountRef.current;
    };

    const isDisabled = useMemo(() => {
      return disabled
        ? true
        : !message.content &&
            isEmpty &&
            !message.imgs?.length &&
            !message.audio?.length;
    }, [disabled, message, isEmpty]);

    const resetMessage = () => {
      setMessage({
        role: message.role,
        content: '',
        imgs: []
      });
    };

    const handleInputChange = (e: any) => {
      onInputChange?.(e);
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
        // @ts-ignore
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
              updateUidCount();
              return {
                uid: uidCountRef.current,
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

    const handleUploadAudioChange = async (data: {
      file: any;
      fileList: any[];
    }) => {
      // convert audio file to base64
      try {
        const base64Audio = await convertFileToBase64(data.file);
        const audioData = await readAudioFile(data.file);
        console.log('audioData====', audioData, message.imgs);
        setMessage((pre) => {
          return {
            ...pre,
            audio: [
              {
                uid: updateUidCount(),
                format: audioTypeMap[data.file.type] as AudioFormat,
                base64: base64Audio.split(',')[1],
                data: _.pick(audioData, ['url', 'name', 'duration'])
              }
            ]
          };
        });
      } catch (error) {
        console.error('Error converting audio to Base64:', error);
      }
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

    const handleDeleteAudio = () => {
      setMessage({
        ...message,
        audio: []
      });
    };

    const handleOnPaste = (e: any) => {
      const text = e.clipboardData.getData('text');
      if (!text) {
        e.preventDefault();
        getPasteContent(e);
      }
    };

    const handleOnKeydown = (e: any) => {
      if (e.key === KeyMap.ENTER.keybinding) {
        if (e.shiftKey) {
          return;
        }
        e.preventDefault();
        if (!loading) {
          handleSendMessage();
        }
      }
    };

    const { ImageURLInput, UploadImageButton } = useAddImage({
      handleUpdateImgList: handleUpdateImgList,
      updateUidCount: updateUidCount
    });

    useImperativeHandle(ref, () => ({
      handleInputChange: handleInputChange
    }));

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
            {title && <span className="font-500">{title}</span>}
            {actions.includes('role') && (
              <>
                <Button
                  type="text"
                  size="middle"
                  variant="filled"
                  color="default"
                  onClick={handleToggleRole}
                  icon={<SwapOutlined rotate={90} />}
                >
                  {intl.formatMessage({ id: `playground.${message.role}` })}
                </Button>
                <Divider orientation="vertical" style={{ margin: 0 }} />
              </>
            )}
            {actions.includes('check') && (
              <Checkbox onChange={onCheck} defaultChecked={defaultChecked}>
                {checkLabel}
              </Checkbox>
            )}
            {actions.includes('upload') &&
              message.role === Roles.User &&
              UploadImageButton}

            {actions.includes('upload') && message.role === Roles.User && (
              <UploadAudio
                maxFileSize={1024 * 1024}
                type="text"
                accept={'.mp3,.wav'}
                size="middle"
                shape="default"
                icon={<CustomerServiceOutlined />}
                onChange={handleUploadAudioChange}
              ></UploadAudio>
            )}
            {tools}
            {actions.includes('clear') && (
              <Tooltip
                title={intl.formatMessage({ id: 'common.button.clear' })}
              >
                <Button
                  disabled={loading}
                  type="text"
                  icon={<ClearOutlined />}
                  size="middle"
                  onClick={handleClearAll}
                ></Button>
              </Tooltip>
            )}

            {actions.includes('layout') && updateLayout && (
              <>
                <Divider orientation="vertical" style={{ margin: 0 }} />
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
            {ImageURLInput}
          </div>
          <div className="actions">
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
                  <IconFont
                    type="icon-stop1"
                    className="font-size-14"
                  ></IconFont>
                }
              ></Button>
            )}
          </div>
        </div>
        <ImgsWrapper>
          <ThumbImg
            style={{ paddingBlockEnd: 0 }}
            dataList={message.imgs || []}
            onDelete={handleDeleteImg}
            editable={true}
          ></ThumbImg>
          {message.audio && message.audio.length > 0 && (
            <AudioWrapper>
              <SimpleAudio
                url={message.audio?.[0].data?.url}
                name={message.audio?.[0].data?.name}
                height={50}
                onDelete={handleDeleteAudio}
              ></SimpleAudio>
            </AudioWrapper>
          )}
        </ImgsWrapper>

        <div className="input-box">
          {actions.includes('paste') ? (
            <TextArea
              ref={inputRef}
              autoSize={{
                minRows: defaultSize.minRows,
                maxRows: defaultSize.maxRows
              }}
              onKeyDown={handleOnKeydown}
              onChange={handleInputChange}
              value={message.content}
              size="large"
              variant="borderless"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onPaste={handleOnPaste}
            ></TextArea>
          ) : (
            <TextArea
              ref={inputRef}
              autoSize={{
                minRows: defaultSize.minRows,
                maxRows: defaultSize.maxRows
              }}
              onKeyDown={handleOnKeydown}
              onChange={handleInputChange}
              value={message.content}
              size="large"
              variant="borderless"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
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
      </div>
    );
  }
);

export default MessageInput;
