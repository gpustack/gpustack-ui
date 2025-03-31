import OverlayScroller from '@/components/overlay-scroller';
import { WarningOutlined } from '@ant-design/icons';
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
    li {
      position: relative;
    }
    li::before {
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
const IncompatiableInfo: React.FC<IncompatiableInfoProps> = (props) => {
  const { data, isEvaluating } = props;
  const intl = useIntl();
  console.log('IncompatiableInfo', data, isEvaluating);
  if (isEvaluating) {
    return (
      <CompatibleTag color="warning">
        {intl.formatMessage({ id: 'models.form.evaluating' })}
      </CompatibleTag>
    );
  }
  if (!data || data?.compatible) {
    return null;
  }
  return (
    <Tooltip
      overlayInnerStyle={{ paddingInline: 0 }}
      title={
        <OverlayScroller maxHeight={200}>
          <IncompatibleInfo>
            <SMTitle $isTitle={!!data?.scheduling_messages?.length}>
              {data?.compatibility_messages}
            </SMTitle>
            {!!data?.scheduling_messages?.length && (
              <ul>
                {data?.scheduling_messages.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </IncompatibleInfo>
        </OverlayScroller>
      }
    >
      <CompatibleTag icon={<WarningOutlined />} color="warning">
        {intl.formatMessage({ id: 'models.form.incompatible' })}
      </CompatibleTag>
    </Tooltip>
  );
};

export default IncompatiableInfo;
