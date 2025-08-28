import ScrollerModal from '@/components/scroller-modal';
import { useIntl } from '@umijs/max';
import React from 'react';
import ContainerInstall from './container-install';

type ViewModalProps = {
  open: boolean;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
  };
  onCancel: () => void;
};

const AddWorker: React.FC<ViewModalProps> = (props) => {
  const { open, onCancel, registrationInfo } = props || {};
  const intl = useIntl();

  return (
    <ScrollerModal
      title={intl.formatMessage({ id: 'resources.button.create' })}
      open={open}
      centered={false}
      onCancel={onCancel}
      destroyOnHidden={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={700}
      style={{
        top: 100
      }}
      maxContentHeight={450}
      footer={null}
    >
      <ContainerInstall registrationInfo={registrationInfo} />
    </ScrollerModal>
  );
};

export default AddWorker;
