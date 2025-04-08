import AlertBlockInfo from '@/components/alert-info/block';
import {
  CheckCircleFilled,
  CloseOutlined,
  LoadingOutlined,
  WarningFilled
} from '@ant-design/icons';
import { Button } from 'antd';
import { isArray } from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface CompatibilityAlertProps {
  warningStatus: {
    show: boolean;
    title?: string;
    isHtml?: boolean;
    type?: Global.MessageType;
    message: string | string[];
  };
  contentStyle?: React.CSSProperties;
  showClose?: boolean;
  onClose?: () => void;
}

const DivWrapper = styled.div`
  position: relative;
  padding-inline: 8px;
  &:hover {
    .close-wrapper {
      display: block;
    }
  }
`;

const CloseWrapper = styled.div`
  display: none;
  position: absolute;
  top: 6px;
  right: 12px;
  line-height: 1;
  cursor: pointer;
  background-color: var(--ant-color-warning-bg);
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  font-size: var(--font-size-small);
  gap: 4px;
`;

const CompatibilityAlert: React.FC<CompatibilityAlertProps> = (props) => {
  const { warningStatus, contentStyle, showClose, onClose } = props;
  const { title, show, message, isHtml, type = 'warning' } = warningStatus;

  const renderMessage = useMemo(() => {
    if (!message || !show) {
      return '';
    }
    if (isHtml) {
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: message as string
          }}
        ></span>
      );
    }
    if (typeof message === 'string') {
      return message;
    }
    if (isArray(message)) {
      return (
        <MessageWrapper>
          {message.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
        </MessageWrapper>
      );
    }
    return '';
  }, [message, show]);

  const renderIcon = useMemo(() => {
    if (type === 'transition') {
      return <LoadingOutlined />;
    }
    if (type === 'success') {
      return <CheckCircleFilled />;
    }
    return <WarningFilled />;
  }, [type]);

  return (
    show &&
    !!message && (
      <DivWrapper>
        <AlertBlockInfo
          ellipsis={false}
          message={renderMessage}
          title={title}
          contentStyle={contentStyle}
          type={type || 'warning'}
          icon={renderIcon}
        ></AlertBlockInfo>
        {showClose && !['transition', 'success'].includes(type) && (
          <CloseWrapper className="close-wrapper">
            <Button
              onClick={onClose}
              icon={<CloseOutlined />}
              size="small"
              type="text"
            ></Button>
          </CloseWrapper>
        )}
      </DivWrapper>
    )
  );
};

export default CompatibilityAlert;
