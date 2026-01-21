import { useIntl } from '@umijs/max';
import { Tabs, TabsProps } from 'antd';
import React, { useState } from 'react';
import PageBox from '../_components/page-box';
import Configure from './components/configure';
import Environment from './components/environment';
import Logs from './components/logs';
import Summary from './components/summary';
import DetailContext from './config/detail-context';

const Details: React.FC = () => {
  const intl = useIntl();
  const [activeKey, setActiveKey] = useState('summary');

  const items: TabsProps['items'] = [
    {
      key: 'summary',
      label: intl.formatMessage({ id: 'benchmark.detail.summary.title' }),
      children: <Summary />
    },
    {
      key: 'configure',
      label: intl.formatMessage({ id: 'benchmark.detail.configure.title' }),
      children: <Configure />
    },
    {
      key: 'environment',
      label: intl.formatMessage({ id: 'benchmark.detail.environment.title' }),
      children: <Environment />
    },
    {
      key: 'logs',
      label: intl.formatMessage({ id: 'benchmark.detail.logs.title' }),
      children: <Logs />
    }
  ];

  const handleChangeTab = (key: string) => {
    setActiveKey(key);
  };

  return (
    <PageBox>
      <DetailContext.Provider value={{}}>
        <Tabs
          activeKey={activeKey}
          onChange={handleChangeTab}
          items={items}
          type="card"
        />
      </DetailContext.Provider>
    </PageBox>
  );
};

export default Details;
