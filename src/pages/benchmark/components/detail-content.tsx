import IconFont from '@/components/icon-font';
import { useIntl, useSearchParams } from '@umijs/max';
import { Tabs, TabsProps } from 'antd';
import React, { useState } from 'react';
import Environment from './environment';
import Summary from './summary';

const Details: React.FC<{
  tabBarExtraContent: {
    right: React.ReactNode;
  };
}> = ({ tabBarExtraContent }) => {
  const intl = useIntl();
  const [activeKey, setActiveKey] = useState('summary');
  const [searchParams] = useSearchParams();

  const items: TabsProps['items'] = [
    {
      key: 'summary',
      label: intl.formatMessage({ id: 'benchmark.detail.summary.title' }),
      children: <Summary />,
      icon: <IconFont type="icon-basic" />
    },
    {
      key: 'environment',
      label: intl.formatMessage({ id: 'benchmark.detail.environment.title' }),
      children: <Environment />,
      icon: <IconFont type="icon-server02" />
    }
  ];

  const handleChangeTab = (key: string) => {
    setActiveKey(key);
  };

  return (
    <Tabs
      size="small"
      activeKey={activeKey}
      onChange={handleChangeTab}
      items={items}
      type="card"
      tabBarExtraContent={tabBarExtraContent}
    />
  );
};

export default Details;
