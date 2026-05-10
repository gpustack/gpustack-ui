import { PageAction } from '@/config';
import FormOverlayView from '@/pages/_components/form-overlay-view';
import { ModalFooter } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useCallback, useRef } from 'react';
import { FormData as StorageFormData } from '../../storage/config/types';
import GPUServiceStorageForm from '../../storage/forms';

interface StorageOverlayProps {
  open: boolean;
  namespace?: string;
  onCancel: () => void;
  onSubmit: (values: StorageFormData) => Promise<void> | void;
}

const StorageOverlay: React.FC<StorageOverlayProps> = ({
  open,
  namespace,
  onCancel,
  onSubmit
}) => {
  const intl = useIntl();
  const formRef = useRef<any>(null);

  const handleSubmit = () => {
    formRef.current?.submit();
  };

  const handleCancel = () => {
    formRef.current?.resetFields();
    onCancel();
  };

  const handleFinish = async (values: StorageFormData) => {
    await onSubmit(values);
  };

  const getOverlayContainer = useCallback(() => {
    const containers = document.querySelectorAll<HTMLElement>(
      '.ant-layout-content'
    );

    return containers[containers.length - 1] ?? null;
  }, []);

  return (
    <FormOverlayView
      title={intl.formatMessage({ id: 'gpuservice.storage.add' })}
      open={open}
      width={600}
      onCancel={handleCancel}
      getContainer={getOverlayContainer}
      footer={
        <ModalFooter
          onOk={handleSubmit}
          onCancel={handleCancel}
          style={{
            padding: '16px 24px 24px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        />
      }
    >
      <GPUServiceStorageForm
        ref={formRef}
        action={PageAction.CREATE}
        open={open}
        namespace={namespace}
        onFinish={handleFinish}
      />
    </FormOverlayView>
  );
};

export default StorageOverlay;
