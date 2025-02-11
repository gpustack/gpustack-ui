import { useIntl } from '@umijs/max';
import { Modal, Tabs, TabsProps } from 'antd';
import React from 'react';
import ContainerInstall from './container-install';
import ScriptInstall from './script-install';

type ViewModalProps = {
  open: boolean;
  onCancel: () => void;
};

const AddWorker: React.FC<ViewModalProps> = (props) => {
  const { open, onCancel } = props || {};
  const intl = useIntl();
  const [token, setToken] = React.useState('');
  const [activeKey, setActiveKey] = React.useState('script');

  const items: TabsProps['items'] = [
    {
      key: 'script',
      label: intl.formatMessage({ id: 'resources.worker.script.install' }),
      children: <ScriptInstall token={token}></ScriptInstall>
    },
    {
      key: 'container',
      label: intl.formatMessage({ id: 'resources.worker.container.install' }),
      children: <ContainerInstall token={token} />
    }
  ];

  return (
    <Modal
      title={intl.formatMessage({ id: 'resources.button.create' })}
      open={open}
      centered={true}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={700}
      styles={{
        body: {
          height: 550
        }
      }}
      footer={null}
    >
      <Tabs
        items={items}
        activeKey={activeKey}
        type="card"
        onChange={(key) => setActiveKey(key)}
      ></Tabs>
    </Modal>
  );
};

export default React.memo(AddWorker);
