import { PageAction } from '@/config';
import FormOverlayView from '@/pages/_components/form-overlay-view';
import { ModalFooter } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useRef, useState } from 'react';
import { FormData as PublicKeyFormData } from '../../public-keys/config/types';
import GPUServicePublicKeyForm from '../../public-keys/forms';
import useCreateSshkey from '../../public-keys/services/use-create-sshkey';
import useOverlayLayout from '../hooks/use-overlay-layout';

interface PublicKeyOverlayProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: PublicKeyFormData) => Promise<void> | void;
}

const PublicKeyOverlay: React.FC<PublicKeyOverlayProps> = ({
  open,
  onCancel,
  onSubmit
}) => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<any>(null);
  const { fetchData: createSshkey } = useCreateSshkey();
  const { drawerWidth, getOverlayContainer } = useOverlayLayout(open);

  const handleSubmit = () => {
    formRef.current?.submit();
  };

  const handleCancel = () => {
    formRef.current?.resetFields();
    onCancel();
  };

  const handleFinish = async (values: PublicKeyFormData) => {
    setLoading(true);
    try {
      await createSshkey({ data: values });
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormOverlayView
      title={intl.formatMessage({ id: 'gpuservice.publicKey.add' })}
      open={open}
      width={drawerWidth}
      onCancel={handleCancel}
      getContainer={getOverlayContainer}
      footer={
        <ModalFooter
          onOk={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          style={{
            padding: '16px 24px 24px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        />
      }
    >
      <GPUServicePublicKeyForm
        ref={formRef}
        action={PageAction.CREATE}
        open={open}
        onFinish={handleFinish}
      />
    </FormOverlayView>
  );
};

export default PublicKeyOverlay;
