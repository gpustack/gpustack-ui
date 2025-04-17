import React from 'react';
import styled from 'styled-components';

const TooltipWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  background-color: rgba(255, 255, 255, 80%);
  min-width: 100px;
  max-width: 360px;

  .tooltip-x-name {
    font-size: var(--font-size-base);
    color: var(--ant-color-text-tertiary);
  }

  .tooltip-item {
    color: var(--ant-color-text-secondary);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .tooltip-item-title {
      margin-right: 2px;
    }

    .tooltip-value {
      margin-left: 10px;
      color: var(--ant-color-text);
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
`;

const ItemSymbol = styled.span<{ $color: string }>`
  background-color: ${(props) => props.$color};
  display: inline-block;
  marginright: 5px;
  borderradius: 8px;
  width: 8px;
  height: 8px;
`;

interface ChartTooltipProps {
  params: any[];
  callback?: (val: any) => any;
}

const ChartTooltip: React.FC<ChartTooltipProps> = (props) => {
  const { params, callback } = props;
  console.log('params====', params);
  return (
    <TooltipWrapper>
      <span className="tooltip-x-name">{params[0]?.axisValue}</span>
      <>
        {params.map((item: any, index: number) => {
          let value = callback?.(item.data.value) || item.data.value;

          return (
            <span className="tooltip-item" key={index}>
              <span className="tooltip-item-name">
                <ItemSymbol $color={item.color}></ItemSymbol>
                <span className="tooltip-title">{item.seriesName}</span>:
              </span>
              <span className="tooltip-value">{value}</span>
            </span>
          );
        })}
      </>
    </TooltipWrapper>
  );
};
export default ChartTooltip;
