import AlertBlockInfo from '@/components/alert-info/block';
import {
  CheckCircleFilled,
  CloseOutlined,
  LoadingOutlined,
  WarningFilled
} from '@ant-design/icons';
import { Button } from 'antd';
import { isArray } from 'lodash';
import React, { useCallback, useMemo } from 'react';
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
  padding-inline: 24px;
  padding-block: 10px 0;
  &:hover {
    .close-wrapper {
      display: block;
    }
  }
`;

const CloseWrapper = styled.div`
  display: none;
  position: absolute;
  top: 16px;
  right: 28px;
  line-height: 1;
  cursor: pointer;
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  font-size: var(--font-size-small);
  gap: 4px;
`;
const linkReg = /<a (.*?)>(.*?)<\/a>/g;
const replaceReg = /<a(?![^>]*\btarget=)([^>]*)>/gi;

const CompatibilityAlert: React.FC<CompatibilityAlertProps> = (props) => {
  const { warningStatus, contentStyle, showClose, onClose } = props;
  const { title, show, message, isHtml, type = 'warning' } = warningStatus;

  const handleLinkMessage = useCallback((msg: string) => {
    const link = msg?.match(linkReg);
    if (link) {
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: msg.replace(replaceReg, '<a target="_blank" $1>')
          }}
        ></span>
      );
    }
    return msg || null;
  }, []);

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
      return handleLinkMessage(message);
    }
    if (isArray(message)) {
      return (
        <MessageWrapper>
          {message.map((item, index) => (
            <div key={index}>{handleLinkMessage(item)}</div>
          ))}
        </MessageWrapper>
      );
    }
    return '';
  }, [message, show, handleLinkMessage]);

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
          overlayScrollerProps={{
            scrollbars: {
              autoHide: 'move'
            }
          }}
        ></AlertBlockInfo>
        {showClose && !['transition'].includes(type) && (
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
