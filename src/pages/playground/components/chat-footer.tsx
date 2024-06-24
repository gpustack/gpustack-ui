import {
  CodeOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Col, Row, Space } from 'antd';
import '../style/chat-footer.less';

interface ChatFooterProps {
  onSubmit: () => void;
  onClear: () => void;
  onNewMessage: () => void;
  onView: () => void;
  disabled?: boolean;
  feedback?: React.ReactNode;
}

const ChatFooter: React.FC<ChatFooterProps> = (props) => {
  const intl = useIntl();
  const { onSubmit, onClear, onNewMessage, onView, feedback, disabled } = props;
  return (
    <div className="chat-footer">
      <Row style={{ width: '100%' }}>
        <Col span={8}>
          <Space size={20}>
            <Button
              disabled={disabled}
              type="primary"
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
        <Col span={8}>{feedback}</Col>
        <Col span={8} style={{ textAlign: 'right' }}>
          <Space size={20}>
            <Button
              icon={<CodeOutlined></CodeOutlined>}
              onClick={onView}
              disabled={disabled}
            >
              {intl.formatMessage({ id: 'playground.viewcode' })}
            </Button>
            <Button
              disabled={disabled}
              type="primary"
              icon={<SaveOutlined></SaveOutlined>}
              onClick={onSubmit}
            >
              {intl.formatMessage({ id: 'common.button.submit' })}
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ChatFooter;
