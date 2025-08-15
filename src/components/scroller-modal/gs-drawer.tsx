import { useEscHint } from '@/hooks/use-esc-hint';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, type DrawerProps } from 'antd';

const ScrollerModal = (props: DrawerProps) => {
  const { title, closable = true, ...restProps } = props;
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
        closable={false}
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
