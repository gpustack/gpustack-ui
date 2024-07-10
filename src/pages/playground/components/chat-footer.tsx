import IconFont from '@/components/icon-font';
import HotKeys from '@/config/hotkeys';
import { platformCall } from '@/utils';
import {
  CodeOutlined,
  DeleteOutlined,
  EnterOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Col, Dropdown, Row, Space } from 'antd';
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
}

const ChatFooter: React.FC<ChatFooterProps> = (props) => {
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
    hasTokenResult
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
        <Col span={hasTokenResult ? 8 : 12}>
          <Space size={20}>
            <Dropdown
              menu={{ items: MessageRoles, onClick: onNewMessage }}
              placement="topLeft"
            >
              <Button disabled={disabled} icon={<PlusOutlined />}>
                {intl.formatMessage({ id: 'playground.newMessage' })}
              </Button>
            </Dropdown>

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
              <Button type="primary" onClick={onStop}>
                <div className="flex flex-center">
                  <span>
                    {intl.formatMessage({ id: 'common.button.stop' })}
                  </span>
                  <span className="m-l-5 flex flex-center">
                    <IconFont
                      type="icon-stop1"
                      className="font-size-14"
                    ></IconFont>
                  </span>
                </div>
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ChatFooter;
