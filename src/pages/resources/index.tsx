import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import type { TabsProps } from 'antd';
import { Tabs } from 'antd';
import { StrictMode, useState } from 'react';
import GPUs from './components/gpus';
import Workers from './components/workers';

const items: TabsProps['items'] = [
  {
    key: 'workers',
    label: 'Workers',
    children: <Workers />
  },
  {
    key: 'gpus',
    label: 'GPUs',
    children: <GPUs />
  }
];
const Resources = () => {
  console.log('resources======');
  const [activeKey, setActiveKey] = useState('workers');

  const intl = useIntl();

  const handleChangeTab = (key: string) => {
    setActiveKey(key);
  };

  return (
    <StrictMode>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'resources.title' })
        }}
        extra={[]}
      >
        <div style={{ marginTop: 60 }}>
          <Tabs
            type="card"
            defaultActiveKey="workers"
            items={items}
            accessKey={activeKey}
            onChange={handleChangeTab}
          ></Tabs>
        </div>
      </PageContainer>
    </StrictMode>
  );
};

export default Resources;
