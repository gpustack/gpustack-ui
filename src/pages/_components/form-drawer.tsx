import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import ColumnWrapper from '@/pages/_components/column-wrapper';

const ModalFooterStyle = {
  padding: '16px 24px 8px',
  display: 'flex',
  justifyContent: 'flex-end'
};

type AddModalProps = {
  title: string;
  open: boolean;
  onCancel: () => void;
  children?: React.ReactNode;
  onSubmit: () => void;
  width?: number;
};
const FormDrawer: React.FC<AddModalProps> = ({
  title,
  open,
  onCancel,
  onSubmit,
  children,
  width = 600
}) => {
  return (
    <GSDrawer
      title={title}
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
          <ModalFooter
            onOk={onSubmit}
            onCancel={onCancel}
            style={ModalFooterStyle}
          ></ModalFooter>
        }
      >
        {children}
      </ColumnWrapper>
    </GSDrawer>
  );
};

export default FormDrawer;
