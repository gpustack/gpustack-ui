import TransitionWrapper from '@/components/transition';
import HotKeys from '@/config/hotkeys';
import { fetchChunkedData, readStreamData } from '@/utils/fetch-chunk-data';
import { EyeInvisibleOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Input, Spin } from 'antd';
import _ from 'lodash';
import { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { CHAT_API } from '../apis';
import { Roles } from '../config';
import '../style/ground-left.less';
import '../style/system-message-wrap.less';
import ChatFooter from './chat-footer';
import MessageItem from './message-item';
import ReferenceParams from './reference-params';
import ViewCodeModal from './view-code-modal';

interface MessageProps {
  parameters: any;
}

interface MessageItemProps {
  role: string;
  content: string;
  uid: number;
}

const MessageList: React.FC<MessageProps> = (props) => {
  const { parameters } = props;
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
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [currentIsFocus, setCurrentIsFocus] = useState(false);
  const systemRef = useRef<any>(null);
  const contentRef = useRef<any>('');

  const handleSystemMessageChange = (e: any) => {
    setSystemMessage(e.target.value);
  };

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
  };
  const handleNewMessage = () => {
    messageList.push({
      role: 'user',
      content: '',
      uid: messageId.current + 1
    });
    setMessageId();
    setMessageList([...messageList]);
    setActiveIndex(messageList.length - 1);
  };

  const joinMessage = (chunk: any) => {
    if (_.get(chunk, 'choices.0.finish_reason')) {
      setTokenResult({
        ...chunk?.usage
      });

      return true;
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
    return false;
  };
  const submitMessage = async () => {
    try {
      setLoading(true);
      setMessageId();
      setTokenResult(null);
      contentRef.current = '';
      const chatParams = {
        messages: systemMessage
          ? [
              {
                role: 'system',
                content: systemMessage
              },
              ...messageList
            ]
          : [...messageList],
        ...parameters,
        stream: true
      };
      const result = await fetchChunkedData({
        data: chatParams,
        url: CHAT_API
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
    setMessageList([]);
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
        <Button type="primary" size="small">
          <EyeInvisibleOutlined />
        </Button>
      </div>
    );
  };

  const handleFocus = () => {
    setCurrentIsFocus(true);
  };

  const handleBlur = () => {
    setCurrentIsFocus(false);
  };

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

  return (
    <div className="ground-left">
      <PageContainer title={false} className="message-list-wrap">
        <div style={{ marginBottom: 40 }}>
          <TransitionWrapper
            header={renderLabel()}
            variant="filled"
            ref={systemRef}
          >
            <Input.TextArea
              value={systemMessage}
              variant="filled"
              autoSize={true}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={intl.formatMessage({ id: 'playground.system.tips' })}
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
      </PageContainer>
      <div className="ground-left-footer">
        <ChatFooter
          onClear={handleClear}
          onNewMessage={handleNewMessage}
          onSubmit={handleSubmit}
          onView={handleView}
          disabled={loading}
          hasTokenResult={!!tokenResult}
          feedback={<ReferenceParams usage={tokenResult}></ReferenceParams>}
        ></ChatFooter>
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
};

export default MessageList;
