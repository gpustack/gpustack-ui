import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import ColumnWrapper from '@/pages/_components/column-wrapper';
import { Tag } from 'antd';
import React from 'react';

const ModalFooterStyle = {
  padding: '16px 24px 8px',
  display: 'flex',
  justifyContent: 'flex-end'
};

type AddModalProps = {
  title: React.ReactNode;
  open: boolean;
  onCancel?: () => void;
  children?: React.ReactNode;
  onSubmit?: () => void;
  width?: number | string;
  footer?: React.ReactNode;
  subTitle?: React.ReactNode;
};
const FormDrawer: React.FC<AddModalProps> = ({
  title,
  open,
  onCancel,
  onSubmit,
  children,
  width = 600,
  subTitle,
  footer
}) => {
  return (
    <GSDrawer
      title={
        <>
          {title}
          {subTitle && (
            <Tag
              variant="outlined"
              style={{
                fontSize: 12,
                fontWeight: 400,
                marginLeft: 8,
                borderRadius: 4,
                borderColor: 'var(--ant-color-border-secondary)',
                color: 'var(--ant-color-text-secondary)'
              }}
            >
              {subTitle}
            </Tag>
          )}
        </>
      }
      open={open}
      onClose={onCancel}
      destroyOnHidden={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      styles={{
        wrapper: { width }
      }}
      footer={false}
    >
      <ColumnWrapper
        styles={{
          container: { paddingBlock: 0 }
        }}
        footer={
          footer ?? (
            <ModalFooter
              onOk={onSubmit}
              onCancel={onCancel}
              style={ModalFooterStyle}
            ></ModalFooter>
          )
        }
      >
        {children}
      </ColumnWrapper>
    </GSDrawer>
  );
};

export default FormDrawer;
