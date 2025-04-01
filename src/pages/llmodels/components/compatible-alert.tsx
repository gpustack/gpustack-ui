import AlertBlockInfo from '@/components/alert-info/block';
import { CloseOutlined } from '@ant-design/icons';
import { isArray } from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface CompatibilityAlertProps {
  warningStatus: {
    show: boolean;
    title?: string;
    isHtml?: boolean;
    message: string | string[];
  };
  contentStyle?: React.CSSProperties;
  showClose?: boolean;
  onClose?: () => void;
}

const DivWrapper = styled.div`
  position: relative;
  padding-inline: 12px;
`;

const CloseWrapper = styled.div`
  position: absolute;
  top: 6px;
  right: 18px;
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
  const { title, show, message, isHtml } = warningStatus;

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

  return (
    show && (
      <DivWrapper>
        <AlertBlockInfo
          ellipsis={false}
          message={renderMessage}
          title={title}
          contentStyle={contentStyle}
          type="warning"
        ></AlertBlockInfo>
        {showClose && (
          <CloseWrapper onClick={onClose}>
            <CloseOutlined />
          </CloseWrapper>
        )}
      </DivWrapper>
    )
  );
};

export default CompatibilityAlert;
