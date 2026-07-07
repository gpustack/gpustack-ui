import { convertFileSize } from '@/utils';
import { AutoTooltip } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import React from 'react';
import styled from 'styled-components';
import '../style/gpu-card.less';
const CardWrapper = styled.div`
  display: flex;
  gap: 8px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  border-bottom: 1px solid var(--ant-color-split);
  padding-bottom: 5px;
`;

const Header = styled.div`
  width: 100%;
`;

const Metric: React.FC<{ label: React.ReactNode; value: React.ReactNode }> = ({
  label,
  value
}) => (
  <span style={{ lineHeight: 1.2 }}>
    {label}: <span>{value}</span>
  </span>
);

const Description = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  color: var(--ant-color-text-tertiary);
`;

export const CardContainer: React.FC<{
  header?: React.ReactNode;
  description?: React.ReactNode;
}> = ({ header, description }) => {
  return (
    <CardWrapper>
      <Header>{header}</Header>
      {description && <Description>{description}</Description>}
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
          <Flex wrap gap={8} style={{ fontSize: 11 }}>
            <Metric
              label={intl.formatMessage({ id: 'resources.table.total' })}
              value={convertFileSize(data?.memory?.total || 0)}
            />
            <Metric
              label={intl.formatMessage({ id: 'resources.table.used' })}
              value={convertFileSize(data?.memory?.used || 0)}
            />
            <Metric
              label={intl.formatMessage({ id: 'resources.table.allocated' })}
              value={convertFileSize(data?.memory?.allocated || 0)}
            />
          </Flex>
        )
      }
    ></CardContainer>
  );
};

export default GPUCard;
