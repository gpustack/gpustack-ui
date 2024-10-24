import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import type { TabsProps } from 'antd';
import { Tabs } from 'antd';
import { useCallback, useState } from 'react';
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
  const [activeKey, setActiveKey] = useState('workers');

  const intl = useIntl();

  const handleChangeTab = useCallback((key: string) => {
    setActiveKey(key);
  }, []);

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'resources.title' })
        }}
        extra={[]}
      >
        <div style={{ marginTop: 30 }}>
          <Tabs
            type="card"
            defaultActiveKey="workers"
            items={items}
            accessKey={activeKey}
            onChange={handleChangeTab}
          ></Tabs>
        </div>
      </PageContainer>
    </>
  );
};

export default Resources;
