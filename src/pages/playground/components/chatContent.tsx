import avatar from '@/assets/images/avatar.png';
import logo from '@/assets/images/logo.png';
import { CopyOutlined, DislikeOutlined, EditOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import chatStyle from './chat-style.less';
import ChatEmpty from './chatEmpty';

export type ChatContentProps = {
  messageList: any[];
};

const QuestionMessage: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className={chatStyle.chatMessageItem}>
      <span className={chatStyle.img}>
        <img src={avatar} alt="" />
      </span>

      <span className={chatStyle.name}>YOU</span>
      <div className={chatStyle.contentWrap}>
        <span className={chatStyle.edit}>
          <Button type="text" size="middle" icon={<EditOutlined />}></Button>
        </span>
        <p className={chatStyle.content}>{content}</p>
      </div>
    </div>
  );
};

const AnswerMessage: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className={chatStyle.chatMessageItem}>
      <span className={chatStyle.img}>
        <img src={logo} alt="" />
      </span>
      <span className={chatStyle.name}>AI</span>
      <p className={chatStyle.content}>{content}</p>
      <Space>
        <Tooltip title="复制">
          <Button type="text" size="middle" icon={<CopyOutlined />}></Button>
        </Tooltip>
        <Tooltip title="刷新">
          <Button type="text" size="middle" icon={<SyncOutlined />}></Button>
        </Tooltip>
        <Tooltip title="回答错误">
          <Button type="text" size="middle" icon={<DislikeOutlined />}></Button>
        </Tooltip>
      </Space>
    </div>
  );
};

const ChatContent: React.FC<ChatContentProps> = ({ messageList }) => {
  if (messageList.length === 0) {
    return <ChatEmpty />;
  }
  return (
    <div className={chatStyle.chatContent}>
      <QuestionMessage content="hello"></QuestionMessage>
      <AnswerMessage content="hello, nice to meet you!"></AnswerMessage>
    </div>
  );
};

export default ChatContent;
