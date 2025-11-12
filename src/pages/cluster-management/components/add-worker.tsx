import ScrollerModal from '@/components/scroller-modal';
import { useIntl } from '@umijs/max';
import React from 'react';
import { ProviderType } from '../config';
import AddWorkerStep from './add-worker-step';

type ViewModalProps = {
  open: boolean;
  provider: ProviderType;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number;
  };
  onCancel: () => void;
};

const AddWorker: React.FC<ViewModalProps> = (props) => {
  const { open, onCancel, registrationInfo, provider } = props || {};
  const intl = useIntl();

  return (
    <ScrollerModal
      title={intl.formatMessage({ id: 'resources.button.create' })}
      open={open}
      centered={true}
      onCancel={onCancel}
      destroyOnHidden={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={860}
      style={{}}
      maxContentHeight={'max(calc(100vh - 200px), 600px)'}
      footer={null}
    >
      <AddWorkerStep registrationInfo={registrationInfo} provider={provider} />
    </ScrollerModal>
  );
};

export default AddWorker;
