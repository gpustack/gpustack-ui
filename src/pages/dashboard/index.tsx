import { useMemoizedFn } from 'ahooks';
import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import PageBox from '../_components/page-box';
import { queryDashboardData } from './apis';
import DashboardInner from './components/dahboard-inner';
import DashboardContext from './config/dashboard-context';
import { DashboardProps } from './config/types';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardProps>({} as DashboardProps);

  const getDashboardData = useMemoizedFn(async () => {
    try {
      setLoading(true);
      const res = await queryDashboardData();
      setData(res);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setData({} as DashboardProps);
    }
  });

  useEffect(() => {
    getDashboardData();
  }, []);

  return (
    <DashboardContext.Provider
      value={{ ...data, fetchData: queryDashboardData }}
    >
      <PageBox>
        <Spin spinning={loading}>
          <DashboardInner />
        </Spin>
      </PageBox>
    </DashboardContext.Provider>
  );
};

export default Dashboard;
