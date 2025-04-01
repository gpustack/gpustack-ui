import OverlayScroller from '@/components/overlay-scroller';
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

  if (isEvaluating) {
    return (
      <CompatibleTag color="blue" bordered={false}>
        <Tooltip title={intl.formatMessage({ id: 'models.form.evaluating' })}>
          <LoadingOutlined />
        </Tooltip>
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
            <SMTitle $isTitle={true}>
              {intl.formatMessage({ id: 'models.form.incompatible' })}
            </SMTitle>
            {
              <ul>
                {data?.compatibility_messages.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
                {data?.scheduling_messages.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            }
          </IncompatibleInfo>
        </OverlayScroller>
      }
    >
      <CompatibleTag
        icon={<WarningOutlined />}
        color="warning"
        bordered={false}
      ></CompatibleTag>
    </Tooltip>
  );
};

export default IncompatiableInfo;
