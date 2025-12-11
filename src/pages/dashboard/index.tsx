import useClusterList from '@/pages/cluster-management/hooks/use-cluster-list';
import useNoResourceResult from '@/pages/llmodels/hooks/use-no-resource-result';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import PageBox from '../_components/page-box';
import { queryDashboardData } from './apis';
import DashboardInner from './components/dahboard-inner';
import DashboardContext from './config/dashboard-context';
import { DashboardProps } from './config/types';

const Dashboard: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardProps>({} as DashboardProps);
  const { fetchAll, clusterList, workerList } = useClusterList();

  const { noResourceResult } = useNoResourceResult({
    loadend: true,
    loading: false,
    dataSource: clusterList.length > 0 ? workerList : [],
    queryParams: {},
    iconType: 'icon-dashboard',
    title:
      clusterList.length > 0
        ? intl.formatMessage({ id: 'noresult.workers.title' })
        : intl.formatMessage({ id: 'noresult.cluster.title' }),
    noClusters: !clusterList.length,
    noWorkers: workerList.length === 0 && clusterList.length > 0,
    defaultContent: {
      subTitle: intl.formatMessage({ id: 'noresult.workers.subTitle' }),
      noFoundText: intl.formatMessage({ id: 'noresult.workers.nofound' }),
      buttonText: intl.formatMessage({ id: 'noresult.workers.button.add' }),
      onClick: () => {}
    }
  });

  const fetchDashboardData = useMemoizedFn(async () => {
    try {
      const res = await queryDashboardData();
      setData(res);
    } catch (error) {
      setData({} as DashboardProps);
    }
  });

  const initData = useMemoizedFn(async () => {
    try {
      setLoading(true);
      const { hasClusters, hasWorkers } = await fetchAll();
      if (!hasClusters || !hasWorkers) {
        setLoading(false);
        return;
      }
      await fetchDashboardData();
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  });

  useEffect(() => {
    initData();
  }, []);

  return (
    <DashboardContext.Provider
      value={{ ...data, fetchData: fetchDashboardData, clusterList }}
    >
      <PageBox>
        <Spin spinning={loading} style={{ minHeight: 300 }}>
          {(!clusterList.length || !workerList.length) && !loading ? (
            noResourceResult
          ) : loading ? null : (
            <DashboardInner />
          )}
        </Spin>
      </PageBox>
    </DashboardContext.Provider>
  );
};

export default Dashboard;
