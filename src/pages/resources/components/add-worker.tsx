import {
  AppleOutlined,
  LinuxOutlined,
  WindowsOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Modal, Tabs, TabsProps } from 'antd';
import React from 'react';
import MacOS from './add-worker-macos';
import Windows from './add-worker-windows';
import ContainerInstall from './container-install';

type ViewModalProps = {
  open: boolean;
  onCancel: () => void;
};

const AddWorker: React.FC<ViewModalProps> = (props) => {
  const { open, onCancel } = props || {};
  const intl = useIntl();
  const [token, setToken] = React.useState('');
  const [activeKey, setActiveKey] = React.useState('container');

  const items: TabsProps['items'] = [
    {
      key: 'container',
      label: 'Linux',
      icon: <LinuxOutlined />,
      children: <ContainerInstall token={token} />
    },
    {
      key: 'macos',
      label: 'macOS(M series 14+)',
      icon: <AppleOutlined />,
      children: <MacOS token={token} />
    },
    {
      key: 'windows',
      label: 'Windows(win 10, win 11)',
      icon: <WindowsOutlined />,
      children: <Windows token={token} />
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
          height: 650
        }
      }}
      footer={null}
    >
      <Tabs
        size="small"
        items={items}
        activeKey={activeKey}
        type="card"
        onChange={(key) => setActiveKey(key)}
      ></Tabs>
    </Modal>
  );
};

export default React.memo(AddWorker);
