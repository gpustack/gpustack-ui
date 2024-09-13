import TransitionWrapper from '@/components/transition';
import HotKeys from '@/config/hotkeys';
import useContainerScroll from '@/hooks/use-container-scorll';
import { fetchChunkedData, readStreamData } from '@/utils/fetch-chunk-data';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Spin, Tooltip } from 'antd';
import _ from 'lodash';
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { CHAT_API } from '../apis';
import { Roles } from '../config';
import '../style/ground-left.less';
import '../style/system-message-wrap.less';
import MessageInput from './message-input';
import MessageItem from './message-item';
import ViewCodeModal from './view-code-modal';

interface MessageProps {
  parameters: any;
  modelList: Global.BaseOption<string>[];
  ref?: any;
}

interface MessageItemProps {
  role: string;
  content: string;
  uid: number;
}

const MessageList: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { parameters, modelList } = props;
  const messageId = useRef<number>(0);
  const [messageList, setMessageList] = useState<MessageItemProps[]>([
    {
      role: 'user',
      content: '',
      uid: messageId.current
    }
  ]);

  const intl = useIntl();
  const [systemMessage, setSystemMessage] = useState('');
  const [collapsed, setCollapsed] = useState(true);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [currentIsFocus, setCurrentIsFocus] = useState(false);
  const systemRef = useRef<any>(null);
  const contentRef = useRef<any>('');
  const controllerRef = useRef<any>(null);
  const scroller = useRef<any>(null);
  const { updateScrollerPosition, handleContentWheel } = useContainerScroll(
    scroller,
    { toBottom: true }
  );

  useEffect(() => {
    updateScrollerPosition();
  }, [messageList]);

  useImperativeHandle(ref, () => {
    return {
      viewCode() {
        setShow(true);
      }
    };
  });
  const handleSystemMessageChange = (e: any) => {
    setSystemMessage(e.target.value);
  };

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
  };
  const handleNewMessage = (message?: { role: string; content: string }) => {
    const newMessage = message || {
      role:
        _.last(messageList)?.role === Roles.User ? Roles.Assistant : Roles.User,
      content: ''
    };
    messageList.push({
      ...newMessage,
      uid: messageId.current + 1
    });
    setMessageId();
    setMessageList([...messageList]);
    setActiveIndex(messageList.length - 1);
  };

  const joinMessage = (chunk: any) => {
    if (!chunk) {
      return;
    }
    if (_.get(chunk, 'choices.0.finish_reason')) {
      setTokenResult({
        ...chunk?.usage
      });
      return;
    }
    contentRef.current =
      contentRef.current + _.get(chunk, 'choices.0.delta.content', '');
    setMessageList([
      ...messageList,
      {
        role: Roles.Assistant,
        content: contentRef.current,
        uid: messageId.current
      }
    ]);
  };
  const handleStopConversation = () => {
    controllerRef.current?.abort?.();
    setLoading(false);
  };

  const submitMessage = async () => {
    if (!parameters.model) return;
    try {
      setLoading(true);
      setMessageId();
      setTokenResult(null);

      controllerRef.current?.abort?.();
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;
      const messages = _.map(messageList, (item: MessageItemProps) => {
        return {
          role: item.role,
          content: item.content
        };
      });

      contentRef.current = '';
      const chatParams = {
        messages: systemMessage
          ? [
              {
                role: Roles.System,
                content: systemMessage
              },
              ...messages
            ]
          : [...messages],
        ...parameters,
        stream: true
      };
      const result = await fetchChunkedData({
        data: chatParams,
        url: CHAT_API,
        signal
      });

      if (!result) {
        return;
      }
      const { reader, decoder } = result;
      await readStreamData(reader, decoder, (chunk: any) => {
        joinMessage(chunk);
      });
      setLoading(false);
    } catch (error) {
      console.log('error=====', error);
      setLoading(false);
    }
  };
  const handleClear = () => {
    if (!messageList.length) {
      return;
    }
    setMessageId();
    setMessageList([
      {
        role: Roles.User,
        content: '',
        uid: messageId.current
      }
    ]);
  };

  const handleView = () => {
    setShow(true);
  };

  const handleSubmit = () => {
    submitMessage();
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const handleDelete = (index: number) => {
    messageList.splice(index, 1);
    setMessageList([...messageList]);
  };

  const handleUpdateMessage = (index: number, message: MessageItemProps) => {
    messageList[index] = message;
    setMessageList([...messageList]);
  };

  const renderLabel = () => {
    return (
      <div className="system-message-wrap ">
        <span className="title">
          {intl.formatMessage({ id: 'playground.system' })}
        </span>
        <Tooltip
          title={
            collapsed
              ? intl.formatMessage({ id: 'common.button.collapse' })
              : intl.formatMessage({ id: 'common.button.expand' })
          }
        >
          <Button size="small">
            {collapsed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          </Button>
        </Tooltip>
      </div>
    );
  };

  const handleFocus = () => {
    setCurrentIsFocus(true);
  };

  const handleBlur = () => {
    setCurrentIsFocus(false);
  };

  const handleSelectModel = () => {};

  const handlePresetPrompt = () => {};

  useHotkeys(
    HotKeys.SUBMIT,
    () => {
      handleSubmit();
    },
    {
      enabled: currentIsFocus && !loading,
      enableOnFormTags: currentIsFocus && !loading,
      preventDefault: true
    }
  );

  useHotkeys(
    HotKeys.CREATE.join(','),
    () => {
      handleNewMessage();
    },
    {
      enabled: !loading,
      enableOnFormTags: !loading,
      preventDefault: true
    }
  );

  useHotkeys(
    HotKeys.CLEAR.join(','),
    () => {
      handleClear();
    },
    {
      enabled: !loading,
      enableOnFormTags: !loading,
      preventDefault: true
    }
  );

  return (
    <div className="ground-left">
      <div
        className="message-list-wrap"
        ref={scroller}
        onWheel={handleContentWheel}
      >
        <div style={{ marginBottom: 40 }}>
          <TransitionWrapper
            header={renderLabel()}
            variant="filled"
            setCollapsed={setCollapsed}
            ref={systemRef}
          >
            <Input.TextArea
              value={systemMessage}
              variant="filled"
              autoSize={true}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={{ minHeight: 40 }}
              placeholder={intl.formatMessage({
                id: 'playground.system.tips'
              })}
              onChange={handleSystemMessageChange}
            ></Input.TextArea>
          </TransitionWrapper>
        </div>

        <div>
          {messageList.map((item, index) => {
            return (
              <MessageItem
                key={item.uid}
                isFocus={index === activeIndex}
                islast={index === messageList.length - 1}
                loading={loading}
                onDelete={() => handleDelete(index)}
                updateMessage={(message: MessageItemProps) =>
                  handleUpdateMessage(index, message)
                }
                onSubmit={handleSubmit}
                message={item}
              />
            );
          })}
          {loading && (
            <Spin>
              <div style={{ height: '46px' }}></div>
            </Spin>
          )}
        </div>
      </div>
      <div className="ground-left-footer">
        <MessageInput
          loading={loading}
          handleSubmit={handleSubmit}
          addMessage={handleNewMessage}
          handleAbortFetch={handleStopConversation}
          clearAll={handleClear}
          setModelSelections={handleSelectModel}
          presetPrompt={handlePresetPrompt}
          modelList={modelList}
        />
        {/* <ChatFooter
          onClear={handleClear}
          onNewMessage={handleNewMessage}
          onSubmit={handleSubmit}
          onView={handleView}
          onStop={handleStopConversation}
          disabled={loading}
          selectedModel={parameters.model}
          hasTokenResult={!!tokenResult}
          feedback={<ReferenceParams usage={tokenResult}></ReferenceParams>}
        ></ChatFooter> */}
      </div>
      <ViewCodeModal
        open={show}
        systemMessage={systemMessage}
        messageList={messageList}
        parameters={parameters}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCodeModal>
    </div>
  );
});

export default memo(MessageList);
