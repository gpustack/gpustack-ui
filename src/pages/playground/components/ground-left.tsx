import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { fetchChunkedData, readStreamData } from '@/utils/fetch-chunk-data';
import { useIntl, useSearchParams } from '@umijs/max';
import { Spin } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { CHAT_API } from '../apis';
import { Roles } from '../config';
import { MessageItem } from '../config/types';
import '../style/ground-left.less';
import '../style/system-message-wrap.less';
import MessageInput from './message-input';
import MessageContent from './multiple-chat/message-content';
import SystemMessage from './multiple-chat/system-message';
import ParamsSettings from './params-settings';
import ReferenceParams from './reference-params';
import ViewCodeModal from './view-code-modal';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const GroundLeft: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;
  const messageId = useRef<number>(0);
  const [messageList, setMessageList] = useState<MessageItem[]>([]);

  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const selectModel = searchParams.get('model') || '';
  const [parameters, setParams] = useState<any>({});
  const [systemMessage, setSystemMessage] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [collapse, setCollapse] = useState(false);
  const contentRef = useRef<any>('');
  const controllerRef = useRef<any>(null);
  const scroller = useRef<any>(null);
  const currentMessageRef = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const messageListLengthCache = useRef<number>(0);

  const { initialize, updateScrollerPosition } = useOverlayScroller();
  const { initialize: innitializeParams } = useOverlayScroller();

  useImperativeHandle(ref, () => {
    return {
      viewCode() {
        setShow(true);
      },
      setCollapse() {
        setCollapse(!collapse);
      }
    };
  });

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
  };

  const joinMessage = (chunk: any) => {
    setTokenResult({
      ...(chunk?.usage ?? {})
    });

    if (!chunk || !_.get(chunk, 'choices', []).length) {
      return;
    }
    contentRef.current =
      contentRef.current + _.get(chunk, 'choices.0.delta.content', '');
    setMessageList([
      ...messageList,
      ...currentMessageRef.current,
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

  const submitMessage = async (current?: { role: string; content: string }) => {
    if (!parameters.model) return;
    try {
      setLoading(true);
      setMessageId();
      setTokenResult(null);

      controllerRef.current?.abort?.();
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;
      currentMessageRef.current = current
        ? [
            {
              ...current,
              uid: messageId.current
            }
          ]
        : [];

      contentRef.current = '';
      setMessageList((pre) => {
        return [...pre, ...currentMessageRef.current];
      });
      const formatMessages = _.map(
        [...messageList, ...currentMessageRef.current],
        (item: MessageItem) => {
          return {
            role: item.role,
            content: [
              {
                type: 'text',
                text: item.content
              },
              ..._.map(
                item.imgs,
                (img: { uid: string | number; dataUrl: string }) => {
                  return {
                    type: 'image_url',
                    image_url: {
                      url: img.dataUrl
                    }
                  };
                }
              )
            ]
          };
        }
      );
      const chatParams = {
        messages: systemMessage
          ? [
              {
                role: Roles.System,
                content: [
                  {
                    type: 'text',
                    text: systemMessage
                  }
                ]
              },
              ...formatMessages
            ]
          : [...formatMessages],
        ...parameters,
        stream: true
      };
      const result: any = await fetchChunkedData({
        data: chatParams,
        url: CHAT_API,
        signal
      });

      if (result?.error) {
        setTokenResult({
          error: true,
          errorMessage: result?.data?.message
        });
        return;
      }
      setMessageId();
      const { reader, decoder } = result;
      await readStreamData(reader, decoder, (chunk: any) => {
        joinMessage(chunk);
      });
    } catch (error) {
      // console.log('error:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleClear = () => {
    if (!messageList.length) {
      return;
    }
    setMessageId();
    setMessageList([]);
    setTokenResult(null);
  };

  const handleSendMessage = (message: Omit<MessageItem, 'uid'>) => {
    console.log('message:', message);
    const currentMessage =
      message.content || message.imgs?.length ? message : undefined;
    submitMessage(currentMessage);
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const handleSelectModel = () => {};

  const handlePresetPrompt = (list: { role: string; content: string }[]) => {
    const sysMsg = list.filter((item) => item.role === 'system');
    const userMsg = list
      .filter((item) => item.role === 'user')
      .map((item) => {
        setMessageId();
        return {
          ...item,
          uid: messageId.current
        };
      });
    setSystemMessage(sysMsg[0]?.content || '');
    setMessageList(userMsg);
  };

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [scroller.current, initialize]);

  useEffect(() => {
    if (paramsRef.current) {
      innitializeParams(paramsRef.current);
    }
  }, [paramsRef.current, innitializeParams]);

  useEffect(() => {
    if (loading) {
      updateScrollerPosition();
    }
  }, [messageList, loading]);

  useEffect(() => {
    if (messageList.length > messageListLengthCache.current) {
      updateScrollerPosition();
    }
    messageListLengthCache.current = messageList.length;
  }, [messageList.length]);

  return (
    <div className="ground-left-wrapper">
      <div className="ground-left">
        <div className="message-list-wrap" ref={scroller}>
          <>
            <div
              style={{
                marginBottom: 20
              }}
            >
              <SystemMessage
                style={{
                  borderRadius: 'var(--border-radius-mini)',
                  overflow: 'hidden'
                }}
                systemMessage={systemMessage}
                setSystemMessage={setSystemMessage}
              ></SystemMessage>
            </div>

            <div className="content">
              <MessageContent
                spans={{
                  span: 24,
                  count: 1
                }}
                messageList={messageList}
                setMessageList={setMessageList}
                editable={true}
                loading={loading}
              />
              {loading && (
                <Spin size="small">
                  <div style={{ height: '46px' }}></div>
                </Spin>
              )}
            </div>
          </>
        </div>
        {tokenResult && (
          <div style={{ height: 40 }}>
            <ReferenceParams usage={tokenResult}></ReferenceParams>
          </div>
        )}
        <div className="ground-left-footer">
          <MessageInput
            scope="chat"
            loading={loading}
            disabled={!parameters.model}
            isEmpty={!messageList.length}
            handleSubmit={handleSendMessage}
            addMessage={handleNewMessage}
            handleAbortFetch={handleStopConversation}
            clearAll={handleClear}
            setModelSelections={handleSelectModel}
            presetPrompt={handlePresetPrompt}
            modelList={modelList}
          />
        </div>
      </div>
      <div
        className={classNames('params-wrapper', {
          collapsed: collapse
        })}
        ref={paramsRef}
      >
        <div className="box">
          <ParamsSettings
            setParams={setParams}
            params={parameters}
            selectedModel={selectModel}
            modelList={modelList}
          />
        </div>
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

export default memo(GroundLeft);
