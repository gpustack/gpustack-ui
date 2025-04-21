import { Segmented, type SegmentedProps } from 'antd';
import React from 'react';
import styled from 'styled-components';

interface SegmentLineProps extends SegmentedProps {
  height?: number;
}

const SegmentedQwrapper = styled.div<{ $height: number }>`
  .ant-segmented.segment-line {
    padding: 0;
    background-color: transparent;
    color: var(--color-white-tertiary);
    border: none;
    box-shadow: none;
    height: ${(props) => props.$height}px;
    display: flex;
    align-items: center;
    .ant-segmented-group {
      gap: 16px;
      height: 100%;
    }
    .ant-segmented-item:hover {
      color: var(--color-white-secondary);
    }
    .ant-segmented-thumb {
      height: 2px;
      padding: 0px;
      bottom: 0px;
      top: unset;
      background-color: var(--color-white-primary) !important;
    }
    .ant-segmented-item-label {
      display: flex;
      align-items: center;
      padding: 0;
      font-size: var(--font-size-small);
    }
    .ant-segmented-item {
      background-color: transparent;
      padding-bottom: 2px;
      display: flex;
      align-items: center;
      &::after {
        background-color: var(--color-white-primary) !important;
        width: 100%;
        height: 0px;
        border-radius: 2px;
        bottom: 0px;
        top: unset;
      }
    }
    .ant-segmented-item-selected {
      background-color: transparent;
      color: var(--color-white-primary);
      &::after {
        height: 2px;
      }
    }
  }
`;

const SegmentLine: React.FC<SegmentLineProps> = (props) => {
  const {
    height = 32,
    size = 'small',
    options = [],
    className = 'segment-line',
    ...rest
  } = props;
  return (
    <SegmentedQwrapper $height={height}>
      <Segmented
        {...rest}
        size={size}
        options={options}
        className={className}
      />
    </SegmentedQwrapper>
  );
};

SegmentLine.displayName = 'SegmentLine';

export default SegmentLine;
