import { useMemoizedFn } from 'ahooks';
import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import PageBox from '../_components/page-box';
import { queryDashboardData } from './apis';
import DashboardInner from './components/dahboard-inner';
import DashboardContext from './config/dashboard-context';
import { DashboardProps } from './config/types';
import useAddResource from './hooks/use-add-resource';

const Dashboard: React.FC = () => {
  const { setLoadingStatus, fetchAll, Modal, loadingStatus, clusterList } =
    useAddResource();
  const [data, setData] = useState<DashboardProps>({} as DashboardProps);

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
      setLoadingStatus({
        loading: true,
        loadend: false
      });
      const { hasClusters, hasWorkers } = await fetchAll();
      if (!hasClusters || !hasWorkers) {
        return;
      }
      await fetchDashboardData();
    } catch (error) {
      // ignore
    } finally {
      setLoadingStatus({
        loading: false,
        loadend: true
      });
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
        <Spin spinning={loadingStatus.loading} style={{ minHeight: 300 }}>
          <DashboardInner />
        </Spin>
      </PageBox>
      {Modal}
    </DashboardContext.Provider>
  );
};

export default Dashboard;
