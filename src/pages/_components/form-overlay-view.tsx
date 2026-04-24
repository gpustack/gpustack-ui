import { ColumnWrapper, IconFont } from '@gpustack/core-ui';
import { Button, Tag } from 'antd';
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
  getContainer
}) => {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) {
      setContainer(null);
      return;
    }

    setContainer(getContainer?.() ?? null);
  }, [getContainer, open]);

  if (!open) {
    return null;
  }

  if (!container) {
    return null;
  }

  return createPortal(
    <div
      className={[styles.overlay, className].filter(Boolean).join(' ')}
      style={{ width, ...style }}
      role="dialog"
      aria-modal="true"
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
    </div>,
    container
  );
};

export default FormOverlayView;
