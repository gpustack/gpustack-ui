import TransitionWrapper from '@/components/transition';
import { EyeInvisibleOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Input, Spin } from 'antd';
import _ from 'lodash';
import { useRef, useState } from 'react';
import { execChatCompletions } from '../apis';
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
const MessageList: React.FC<MessageProps> = (props) => {
  const { parameters } = props;
  const [messageList, setMessageList] = useState<
    { role: string; content: string }[]
  >([
    {
      role: 'user',
      content: ''
    }
  ]);

  const [systemMessage, setSystemMessage] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const systemRef = useRef<any>(null);

  const handleSystemMessageChange = (e: any) => {
    setSystemMessage(e.target.value);
  };
  const handleNewMessage = () => {
    messageList.push({
      role: 'user',
      content: ''
    });
    setMessageList([...messageList]);
    setActiveIndex(messageList.length - 1);
  };

  const submitMessage = async () => {
    try {
      setLoading(true);

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
        ...parameters
      };
      const data = await execChatCompletions(chatParams);
      const assistant = _.get(data, ['choices', '0', 'message']);
      setTokenResult({
        ...data.usage
      });
      setMessageList([
        ...messageList,
        {
          role: Roles.Assistant,
          content: assistant.content
        }
      ]);
      setLoading(false);
    } catch (error) {
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
    console.log('submit');
    submitMessage();
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const handleDelete = (index: number) => {
    messageList.splice(index, 1);
    setMessageList([...messageList]);
  };

  const handleUpdateMessage = (
    index: number,
    message: { role: string; content: string }
  ) => {
    messageList[index] = message;
    console.log('updatemessage========', index, message);
    setMessageList([...messageList]);
  };

  const renderLabel = () => {
    return (
      <div className="system-message-wrap ">
        <span className="title">System</span>
        <Button type="primary" size="small">
          <EyeInvisibleOutlined />
        </Button>
      </div>
    );
  };
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
              placeholder="Enter system message here..."
              onChange={handleSystemMessageChange}
            ></Input.TextArea>
          </TransitionWrapper>
        </div>

        <div>
          {messageList.map((item, index) => {
            return (
              <MessageItem
                key={index}
                isFocus={index === activeIndex}
                islast={index === messageList.length - 1}
                loading={loading}
                onDelete={() => handleDelete(index)}
                updateMessage={(message: { role: string; content: string }) =>
                  handleUpdateMessage(index, message)
                }
                message={item}
              />
            );
          })}
          {loading && (
            <Spin>
              <MessageItem
                message={{ role: Roles.Assistant, content: '' }}
                isFocus={false}
                onDelete={() => {}}
                updateMessage={() => {}}
              />
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
          feedback={<ReferenceParams usage={tokenResult}></ReferenceParams>}
        ></ChatFooter>
      </div>
      <ViewCodeModal
        open={show}
        systemMessage={systemMessage}
        messageList={messageList}
        parameters={parameters}
        onCancel={handleCloseViewCode}
        title="View code"
      ></ViewCodeModal>
    </div>
  );
};

export default MessageList;
