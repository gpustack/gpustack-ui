import Logo from '@/assets/images/logo.png';
import chatStyle from './chat-style.less'

const ChatEmpty:React.FC = () => {
  return (
    <div className={chatStyle.chatEmpty}>
      <div className={chatStyle.logo}>
        <img src={Logo} alt="chat empty" />
      </div>
      <h3 className={chatStyle.tips}>How can I help you today?</h3>
    </div>
  );
}

export default ChatEmpty;