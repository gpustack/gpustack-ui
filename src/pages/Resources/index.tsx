import { PageContainer } from '@ant-design/pro-components';
import type { TabsProps } from 'antd';
import { Tabs } from 'antd';
import { useState } from 'react';
import GPUs from './components/gpus';
import Nodes from './components/nodes';

const items: TabsProps['items'] = [
  {
    key: 'nodes',
    label: 'Nodes',
    children: <Nodes />
  },
  {
    key: 'gpus',
    label: 'GPUs',
    children: <GPUs />
  }
];
const Resources = () => {
  const [activeKey, setActiveKey] = useState('test');

  const handleChangeTab = (key: string) => {
    setActiveKey(key);
  };

  return (
    <PageContainer
      ghost
      header={{
        title: 'Resources'
      }}
      extra={[]}
    >
      <div style={{ marginTop: 70 }}>
        <Tabs
          type="card"
          defaultActiveKey="nodes"
          items={items}
          accessKey={activeKey}
          onChange={handleChangeTab}
        ></Tabs>
      </div>
    </PageContainer>
  );
};

export default Resources;
