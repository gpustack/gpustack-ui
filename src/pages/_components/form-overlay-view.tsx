import { ColumnWrapper, IconFont } from '@gpustack/core-ui';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { createPortal } from 'react-dom';
import styles from './form-overlay-view.module.less';

type FormOverlayViewProps = {
  title: React.ReactNode;
  open: boolean;
  onCancel?: () => void;
  children?: React.ReactNode;
  onSubmit?: () => void;
  footer?: React.ReactNode;
  subTitle?: React.ReactNode;
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
  maskClosable?: boolean;
  getContainer?: () => HTMLElement | null | undefined;
};

const FormOverlayView: React.FC<FormOverlayViewProps> = ({
  title,
  open,
  onCancel,
  onSubmit,
  children,
  subTitle,
  footer,
  width = 600,
  className,
  style,
  maskClosable = false,
  getContainer
}) => {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setContainer(getContainer?.() ?? null);
      setMounted(true);
      return;
    }

    setActive(false);
  }, [getContainer, open]);

  React.useEffect(() => {
    if (!mounted || !container) {
      return;
    }

    const id = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(id);
  }, [mounted, container]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') {
      return;
    }
    if (!open && !active) {
      setMounted(false);
      setContainer(null);
    }
  };

  if (!mounted || !container) {
    return null;
  }

  return createPortal(
    <>
      <div
        className={classNames(styles.mask, { [styles.maskOpen]: active })}
        onClick={maskClosable ? onCancel : undefined}
      />
      <div
        className={classNames(
          styles.overlay,
          { [styles.overlayOpen]: active },
          className
        )}
        style={{ width, ...style }}
        role="dialog"
        aria-modal="true"
        onTransitionEnd={handleTransitionEnd}
      >
        <div className={styles.header}>
          <Button
            type="text"
            size="small"
            style={{ fontWeight: 600, fontSize: 16 }}
            icon={<IconFont type="icon-down2" rotate={90} />}
            onClick={onCancel}
          />
          <div className={styles.title}>
            {title}
            {subTitle && (
              <Tag variant="outlined" className={styles.subTitle}>
                {subTitle}
              </Tag>
            )}
          </div>
        </div>
        <ColumnWrapper
          styles={{
            container: { paddingBlock: 16 }
          }}
          footer={footer}
        >
          {children}
        </ColumnWrapper>
      </div>
    </>,
    container
  );
};

export default FormOverlayView;
