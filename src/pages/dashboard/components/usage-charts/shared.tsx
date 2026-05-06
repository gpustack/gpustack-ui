import { CardWrapper } from '@gpustack/core-ui';
import { Spin } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { usageChartCardHeight, usageChartHeight } from '../../config';

export const ChartTitle = styled.div`
  font-weight: var(--font-weight-bold);
  margin-bottom: 12px;
`;

const UsageChartCard: React.FC<{
  title: React.ReactNode;
  children: React.ReactNode;
  height?: number | string;
}> = ({ title, children, height = usageChartCardHeight }) => {
  return (
    <CardWrapper style={{ height }}>
      <ChartTitle>{title}</ChartTitle>
      {children}
    </CardWrapper>
  );
};

export default UsageChartCard;

export const ChartLoadingBox: React.FC<{ height?: number | string }> = ({
  height = usageChartHeight
}) => {
  return (
    <div
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Spin size="middle" />
    </div>
  );
};
