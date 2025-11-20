import { Segmented, type SegmentedProps } from 'antd';
import React from 'react';
import styled from 'styled-components';

interface ThemeType {
  color: string;
  itemColorHover: string;
  itemSelectedColor: string;
  thumbBgColor: string;
  fontWeight: number;
}
interface SegmentLineProps extends SegmentedProps {
  height?: number;
  theme?: 'dark' | 'light';
  showTitle?: boolean;
}

const darkTheme: ThemeType = {
  color: 'var(--color-white-tertiary)',
  itemColorHover: 'var(--color-white-secondary)',
  itemSelectedColor: 'var(--color-white-primary)',
  thumbBgColor: 'var(--color-white-primary)',
  fontWeight: 400
};

const lightTheme: ThemeType = {
  color: 'var(--ant-segmented-item-color)',
  itemColorHover: 'var(--ant-segmented-item-hover-color)',
  itemSelectedColor: 'var(--ant-segmented-item-selected-color)',
  thumbBgColor: 'var(--ant-color-primary)',
  fontWeight: 500
};

const SegmentedQwrapper = styled.div<{
  $height: number;
  $theme: ThemeType;
}>`
  .ant-segmented.segment-line {
    padding: 0;
    background-color: transparent;
    color: ${(props) => props.$theme.color};
    font-weight: ${(props) => props.$theme.fontWeight};
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
      color: ${(props) => props.$theme.itemColorHover};
    }
    .ant-segmented-thumb {
      height: 2px;
      padding: 0px;
      bottom: 0px;
      top: unset;
      background-color: ${(props) => props.$theme.thumbBgColor} !important;
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
        background-color: ${(props) => props.$theme.thumbBgColor} !important;
        width: 100%;
        height: 0px;
        border-radius: 2px;
        bottom: 0px;
        top: unset;
        opacity: 1;
      }
    }

    .ant-segmented-item-selected {
      background-color: transparent;
      box-shadow: none;
      color: ${(props) => props.$theme.itemSelectedColor};
      &::after {
        height: 2px;
        opacity: 1;
      }
    }
  }
  &.with-title .ant-segmented.segment-line {
    .ant-segmented-item.ant-segmented-item-selected::after {
      display: none;
    }
  }
`;

const SegmentLine: React.FC<SegmentLineProps> = (props) => {
  const {
    height = 32,
    size = 'small',
    options = [],
    className = 'segment-line',
    theme = 'dark',
    showTitle = false,
    ...rest
  } = props;

  return (
    <SegmentedQwrapper
      className={showTitle ? 'with-title' : ''}
      $height={height}
      $theme={theme === 'dark' ? darkTheme : lightTheme}
    >
      <Segmented
        {...rest}
        size={size}
        options={options}
        className={className}
      />
    </SegmentedQwrapper>
  );
};

export default SegmentLine;
