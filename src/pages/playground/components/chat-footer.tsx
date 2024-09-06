import IconFont from '@/components/icon-font';
import HotKeys from '@/config/hotkeys';
import { platformCall } from '@/utils';
import { ClearOutlined, EnterOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Col, Row, Space } from 'antd';
import { useHotkeys } from 'react-hotkeys-hook';
import { Roles } from '../config';
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
  selectedModel?: string;
}

const ChatFooter: React.FC<ChatFooterProps> = (props) => {
  console.log('chat footer=====');
  const platform = platformCall();
  const intl = useIntl();
  const {
    onSubmit,
    onClear,
    onStop,
    onNewMessage,
    onView,
    feedback,
    disabled,
    hasTokenResult,
    selectedModel
  } = props;
  useHotkeys(
    HotKeys.SUBMIT.join(','),
    () => {
      onSubmit();
    },
    { enabled: !disabled }
  );

  const MessageRoles = [
    { key: Roles.User, label: intl.formatMessage({ id: 'playground.user' }) },
    {
      key: Roles.Assistant,
      label: intl.formatMessage({ id: 'playground.assistant' })
    }
  ];

  return (
    <div className="chat-footer">
      <Row style={{ width: '100%' }}>
        <Col lg={hasTokenResult ? 8 : 12} xs={24} sm={24} md={24}>
          <Space size={20}>
            <Button
              disabled={disabled}
              icon={<PlusOutlined />}
              onClick={onNewMessage}
            >
              {intl.formatMessage({ id: 'playground.newMessage' })}
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={onClear}
              disabled={disabled}
            >
              {intl.formatMessage({ id: 'common.button.clear' })}
            </Button>
          </Space>
        </Col>
        <Col
          lg={hasTokenResult ? 8 : 0}
          xs={hasTokenResult ? 24 : 0}
          sm={hasTokenResult ? 24 : 0}
          md={hasTokenResult ? 24 : 0}
        >
          {feedback}
        </Col>
        <Col
          lg={hasTokenResult ? 8 : 12}
          xs={24}
          sm={24}
          md={24}
          style={{ textAlign: 'right' }}
        >
          <Space size={20}>
            {!disabled ? (
              <Button
                type="primary"
                disabled={disabled || !selectedModel}
                onClick={onSubmit}
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
                type="primary"
                onClick={onStop}
                icon={<IconFont type="icon-stop1"></IconFont>}
              >
                <span>{intl.formatMessage({ id: 'common.button.stop' })}</span>
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ChatFooter;
