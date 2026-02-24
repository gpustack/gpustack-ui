import { Spin } from 'antd';
import { useEffect } from 'react';
import PageBox from '../_components/page-box';
import DashboardInner from './components/dahboard-inner';
import DashboardContext from './config/dashboard-context';
import useQueryDashboard from './services/use-query-dashboard';

const Dashboard: React.FC = () => {
  const { fetchData, loading, data, cancelRequest } = useQueryDashboard();

  useEffect(() => {
    fetchData({});
    return () => {
      cancelRequest();
    };
  }, []);

  return (
    <DashboardContext.Provider value={{ ...data, fetchData: fetchData }}>
      <PageBox>
        <Spin spinning={loading} style={{ minHeight: 300 }}>
          <DashboardInner />
        </Spin>
      </PageBox>
    </DashboardContext.Provider>
  );
};

export default Dashboard;
