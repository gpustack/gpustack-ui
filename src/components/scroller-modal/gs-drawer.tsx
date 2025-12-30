import { useEscHint } from '@/hooks/use-esc-hint';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, type DrawerProps } from 'antd';
import React from 'react';

/**
 * use ColumnWrapper to wrap content in Drawer with scroller
 * 57px is the height of header
 * @param props
 * @returns
 */
const ScrollerModal = (props: DrawerProps) => {
  const {
    title,
    closable = true,
    maskClosable = false,
    styles,
    ...restProps
  } = props;
  const { EscHint } = useEscHint({
    enabled: !props.keyboard && props.open
  });
  const handleCancel = (e: React.MouseEvent<HTMLElement>) => {
    props.onClose?.(e);
  };

  return (
    <>
      <Drawer
        {...restProps}
        styles={{
          wrapper: {
            ...styles?.wrapper
          },
          root: {
            ...styles?.root
          },
          body: {
            height: 'calc(100vh - 57px)',
            paddingBlock: 16,
            paddingInline: 0,
            overflowX: 'hidden',
            ...styles?.body
          },
          section: {
            borderRadius: '6px 0 0 6px',
            ...styles?.section
          }
        }}
        closable={false}
        maskClosable={maskClosable}
        title={
          <div className="flex-between flex-center">
            <span
              style={{
                color: 'var(--ant-color-text)',
                fontWeight: 'var(--font-weight-medium)',
                fontSize: 'var(--font-size-middle)'
              }}
            >
              {title}
            </span>
            {closable && (
              <Button type="text" size="small" onClick={handleCancel}>
                <CloseOutlined></CloseOutlined>
              </Button>
            )}
          </div>
        }
      >
        {restProps.children}
        {EscHint}
      </Drawer>
    </>
  );
};

export default ScrollerModal;
