import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import type { TabsProps } from 'antd';
import { Tabs } from 'antd';
import { useState } from 'react';
import GPUs from './components/gpus';
import Nodes from './components/nodes';

const items: TabsProps['items'] = [
  {
    key: 'workers',
    label: 'Workers',
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

  const intl = useIntl();

  const handleChangeTab = (key: string) => {
    setActiveKey(key);
  };

  return (
    <PageContainer
      ghost
      header={{
        title: intl.formatMessage({ id: 'resources.title' })
      }}
      extra={[]}
    >
      <div style={{ marginTop: 70 }}>
        <Tabs
          type="card"
          defaultActiveKey="workers"
          items={items}
          accessKey={activeKey}
          onChange={handleChangeTab}
        ></Tabs>
      </div>
    </PageContainer>
  );
};

export default Resources;
