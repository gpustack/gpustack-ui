import AutoTooltip from '@/components/auto-tooltip';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import '../style/gpu-card.less';

const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  border-bottom: 1px solid var(--ant-color-split);
  padding-bottom: 10px;
`;

const Header = styled.div`
  width: 100%;
  margin-bottom: 10px;
`;

const Description = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  color: var(--ant-color-text-tertiary);
`;

export const CardContainer: React.FC<{
  header?: React.ReactNode;
  description?: React.ReactNode;
}> = ({ header, description }) => {
  return (
    <CardWrapper>
      <Header>{header}</Header>
      <Description>{description}</Description>
    </CardWrapper>
  );
};

const GPUCard: React.FC<{
  data: any;
  header?: React.ReactNode;
  info?: React.ReactNode;
}> = ({ data, header, info }) => {
  const intl = useIntl();
  return (
    <CardContainer
      header={
        header || (
          <AutoTooltip ghost>
            <span className="font-700">[{data.index}] </span>
            {data.label}
          </AutoTooltip>
        )
      }
      description={
        info || (
          <>
            <span>
              {intl.formatMessage({ id: 'resources.table.vram' })}(
              {intl.formatMessage({ id: 'resources.table.used' })}/
              {intl.formatMessage({ id: 'resources.table.total' })}):{' '}
              <span>
                {convertFileSize(
                  data?.memory?.used || data?.memory?.allocated || 0
                )}{' '}
                / {convertFileSize(data?.memory?.total || 0)}
              </span>
            </span>
            <span>
              <span>
                {intl.formatMessage({ id: 'resources.table.gpuutilization' })}
                :{' '}
              </span>
              {data?.memory?.used
                ? _.round(data?.memory?.utilization_rate || 0, 2)
                : _.round(data.memory?.allocated / data.memory?.total, 2) * 100}
              %
            </span>
          </>
        )
      }
    ></CardContainer>
  );
};

export default GPUCard;
