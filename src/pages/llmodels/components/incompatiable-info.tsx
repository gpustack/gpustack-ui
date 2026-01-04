import { TooltipOverlayScroller } from '@/components/overlay-scroller';
import { LoadingOutlined, WarningOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tag, Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { EvaluateResult } from '../config/types';

interface IncompatiableInfoProps {
  data?: EvaluateResult;
  isEvaluating?: boolean;
}

const CompatibleTag = styled(Tag)`
  border-radius: 4px;
  margin-right: 0;
  font-size: var(--font-size-base);
  background: transparent !important;
  padding-inline: 0;
`;

const IncompatibleInfo = styled.div`
  display: flex;
  flex-direction: column;
  ul {
    margin: 0;
    font-size: var(--font-size-small);
    padding: 0;
    padding-left: 16px;
    color: var(--color-white-secondary);
    list-style: none;
    &.error-msg {
      padding-left: 0;
    }
    li {
      position: relative;
      line-height: 20px;
      white-space: pre-wrap;
    }
    li.normal::before {
      position: absolute;
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      left: -14px;
      top: 8px;
      border-radius: 50%;
      background-color: var(--color-white-secondary);
    }
  }
`;

const SMTitle = styled.div<{ $isTitle?: boolean }>`
  font-weight: ${(props) => (props.$isTitle ? 'bold' : 'normal')};
  font-size: var(--font-size-small);
`;

const MessageList = ({
  messageList,
  error
}: {
  messageList: string[];
  error?: boolean;
}) => {
  return (
    <ul className={`${error ? 'error-msg' : ''}`}>
      {messageList.map((item, index) => (
        <li key={index} className={`${!error ? 'normal' : 'error'}`}>
          {item}
        </li>
      ))}
    </ul>
  );
};

const IncompatiableInfo: React.FC<IncompatiableInfoProps> = (props) => {
  const { data, isEvaluating } = props;
  const { error, error_message, compatibility_messages, scheduling_messages } =
    data || {};
  const intl = useIntl();

  if (isEvaluating) {
    return (
      <CompatibleTag color="blue" variant="filled">
        <Tooltip title={intl.formatMessage({ id: 'models.form.evaluating' })}>
          <LoadingOutlined />
        </Tooltip>
      </CompatibleTag>
    );
  }
  if (!data || data?.compatible) {
    return null;
  }
  const messageList = [
    ...(compatibility_messages || []),
    ...(scheduling_messages || []),
    ...(error_message ? [error_message] : [])
  ];
  return (
    <TooltipOverlayScroller
      maxHeight={200}
      title={
        <IncompatibleInfo>
          <SMTitle $isTitle={true}>
            {error
              ? intl.formatMessage({ id: 'models.search.evaluate.error' })
              : intl.formatMessage({ id: 'models.form.incompatible' })}
          </SMTitle>
          <MessageList messageList={messageList} error={error}></MessageList>
        </IncompatibleInfo>
      }
    >
      <CompatibleTag
        icon={<WarningOutlined />}
        color={error ? 'error' : 'warning'}
        variant="filled"
      ></CompatibleTag>
    </TooltipOverlayScroller>
  );
};

export default IncompatiableInfo;
