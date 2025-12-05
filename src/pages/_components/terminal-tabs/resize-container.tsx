import { HolderOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import { Resizable, ResizableProps } from 're-resizable';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  position: absolute;
  padding: 0;
  top: -12px;
  font-size: var(--font-size-middle);
  left: calc(50% + 10px);
  transform: translateX(-50%);
  background: none !important;
  cursor: ns-resize;
  &::hover {
    background: none !important;
  }
`;

const ResizeContainer: React.FC<
  React.PropsWithChildren<
    ResizableProps & {
      ref?: any;
      defaultHeight?: number;
      defaultWidth?: number;
      minHeight?: number;
      maxHeight?: number;
      onReSize?: (
        e: MouseEvent | TouchEvent,
        dir: any,
        refToElement: HTMLElement
      ) => void;
      onReSizeStop?: (
        e: MouseEvent | TouchEvent,
        dir: any,
        refToElement: HTMLElement,
        delta: { width: number; height: number }
      ) => void;
    }
  >
> = forwardRef((props, ref) => {
  const {
    defaultWidth,
    defaultHeight = 180,
    minHeight = 180,
    maxHeight = 400,
    children,
    onReSize,
    onReSizeStop,
    ...restProps
  } = props;
  const intl = useIntl();
  const resizeRef = useRef<Resizable>(null);

  useImperativeHandle(ref, () => ({
    container: resizeRef.current
  }));

  const dragHanle = (
    <StyledButton
      size="small"
      type="text"
      icon={
        <HolderOutlined
          rotate={90}
          style={{ fontSize: 'var(--font-size-14)' }}
        />
      }
    ></StyledButton>
  );

  return (
    <Resizable
      ref={resizeRef}
      enable={{
        top: true
      }}
      defaultSize={{
        height: defaultHeight,
        width: defaultWidth
      }}
      handleComponent={{
        top: undefined
      }}
      maxHeight={maxHeight}
      minHeight={minHeight}
      onResize={onReSize}
      onResizeStop={onReSizeStop}
      {...restProps}
    >
      {children}
    </Resizable>
  );
});

export default ResizeContainer;
