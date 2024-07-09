import IconFont from '@/components/icon-font';
import HotKeys from '@/config/hotkeys';
import {
  CodeOutlined,
  DeleteOutlined,
  EnterOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Col, Row, Space } from 'antd';
import { useHotkeys } from 'react-hotkeys-hook';
import '../style/chat-footer.less';

interface ChatFooterProps {
  onSubmit: () => void;
  onStop: () => void;
  onClear: () => void;
  onNewMessage: () => void;
  onView: () => void;
  disabled?: boolean;
  feedback?: React.ReactNode;
  hasTokenResult?: boolean;
}

const ChatFooter: React.FC<ChatFooterProps> = (props) => {
  const intl = useIntl();
  const {
    onSubmit,
    onClear,
    onStop,
    onNewMessage,
    onView,
    feedback,
    disabled,
    hasTokenResult
  } = props;
  useHotkeys(
    HotKeys.SUBMIT.join(','),
    () => {
      onSubmit();
    },
    { enabled: !disabled }
  );

  const renderSubmitButton = () => {
    if (disabled) {
      return (
        <>
          {intl.formatMessage({ id: 'common.button.stop' })}
          <span className="m-l-5">
            <IconFont type="icon-stop"></IconFont>
          </span>
        </>
      );
    }
    return (
      <>
        {intl.formatMessage({ id: 'common.button.submit' })}
        <span className="m-l-5 opct-7">
          <IconFont type="icon-command"></IconFont> + <EnterOutlined />
        </span>
      </>
    );
  };
  return (
    <div className="chat-footer">
      <Row style={{ width: '100%' }}>
        <Col span={hasTokenResult ? 8 : 12}>
          <Space size={20}>
            <Button
              disabled={disabled}
              icon={<PlusOutlined />}
              onClick={onNewMessage}
            >
              {intl.formatMessage({ id: 'playground.newMessage' })}
            </Button>
            <Button
              icon={<DeleteOutlined></DeleteOutlined>}
              onClick={onClear}
              disabled={disabled}
            >
              {intl.formatMessage({ id: 'common.button.clear' })}
            </Button>
          </Space>
        </Col>
        <Col span={hasTokenResult ? 8 : 0}>{feedback}</Col>
        <Col span={hasTokenResult ? 8 : 12} style={{ textAlign: 'right' }}>
          <Space size={20}>
            <Button
              icon={<CodeOutlined></CodeOutlined>}
              onClick={onView}
              disabled={disabled}
            >
              {intl.formatMessage({ id: 'playground.viewcode' })}
            </Button>
            {!disabled ? (
              <Button type="primary" disabled={disabled} onClick={onSubmit}>
                {intl.formatMessage({ id: 'common.button.submit' })}
                <span className="m-l-5 opct-7">
                  <IconFont type="icon-command"></IconFont> + <EnterOutlined />
                </span>
              </Button>
            ) : (
              <Button type="primary" onClick={onStop}>
                {intl.formatMessage({ id: 'common.button.stop' })}
                <span className="m-l-5">
                  <IconFont type="icon-stop"></IconFont>
                </span>
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ChatFooter;
