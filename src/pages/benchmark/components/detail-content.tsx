import IconFont from '@/components/icon-font';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import { useIntl, useSearchParams } from '@umijs/max';
import { Tabs, TabsProps } from 'antd';
import React, { useEffect, useState } from 'react';
import DetailContext from '../config/detail-context';
import { BenchmarkListItem } from '../config/types';
import useQueryDetail from '../services/use-query-detail';
import Configure from './configure';
import Environment from './environment';
import Summary from './summary';

const Details: React.FC<{ currentData?: BenchmarkListItem }> = ({
  currentData
}) => {
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const { loading, detailData, cancelRequest, fetchData } = useQueryDetail();
  const {
    clusterList,
    fetchClusterList,
    cancelRequest: cancelClusterRequest
  } = useQueryClusterList();
  const [activeKey, setActiveKey] = useState('summary');

  const items: TabsProps['items'] = [
    {
      key: 'summary',
      label: intl.formatMessage({ id: 'benchmark.detail.summary.title' }),
      children: <Summary />,
      icon: <IconFont type="icon-basic" />
    },
    {
      key: 'configure',
      label: intl.formatMessage({ id: 'benchmark.detail.configure.title' }),
      children: <Configure />,
      icon: <IconFont type="icon-settings-02" />
    },
    {
      key: 'environment',
      label: intl.formatMessage({ id: 'benchmark.detail.environment.title' }),
      children: <Environment />,
      icon: <IconFont type="icon-server02" />
    }
    // {
    //   key: 'logs',
    //   label: intl.formatMessage({ id: 'benchmark.detail.logs.title' }),
    //   children: <Logs />,
    //   icon: <IconFont type="icon-logs" />
    // }
  ];

  const handleChangeTab = (key: string) => {
    setActiveKey(key);
  };

  useEffect(() => {
    if (id) {
      fetchData(id);
      fetchClusterList({ page: -1 });
    } else {
      cancelRequest();
      cancelClusterRequest();
    }
  }, [id]);

  return (
    <DetailContext.Provider
      value={{
        detailData: detailData || {},
        clusterList: clusterList,
        loading: loading,
        id: Number(id)
      }}
    >
      <Tabs
        size="small"
        activeKey={activeKey}
        onChange={handleChangeTab}
        items={items}
        type="card"
      />
    </DetailContext.Provider>
  );
};

export default Details;
