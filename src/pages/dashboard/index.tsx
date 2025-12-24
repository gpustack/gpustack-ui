import { useMemoizedFn } from 'ahooks';
import { Spin } from 'antd';
import { omit } from 'lodash';
import { useEffect, useState } from 'react';
import PageBox from '../_components/page-box';
import { queryDashboardData } from './apis';
import DashboardInner from './components/dahboard-inner';
import DashboardContext from './config/dashboard-context';
import { DashboardProps } from './config/types';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardProps>({} as DashboardProps);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = useMemoizedFn(
    async (params?: { cluster_id?: number }) => {
      try {
        setLoading(true);
        const res = await queryDashboardData(params);
        setData((prev) => {
          return params?.cluster_id
            ? {
                ...omit(prev, ['system_load']),
                system_load: res.system_load
              }
            : res;
        });
      } catch (error) {
        setData({} as DashboardProps);
      } finally {
        setLoading(false);
      }
    }
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <DashboardContext.Provider
      value={{ ...data, fetchData: fetchDashboardData }}
    >
      <PageBox>
        <Spin spinning={loading} style={{ minHeight: 300 }}>
          <DashboardInner />
        </Spin>
      </PageBox>
    </DashboardContext.Provider>
  );
};

export default Dashboard;
