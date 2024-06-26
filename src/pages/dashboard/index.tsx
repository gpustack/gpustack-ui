import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import { queryDashboardData } from './apis';
import ActiveTable from './components/active-table';
import Overview from './components/over-view';
import SystemLoad from './components/system-load';
import Usage from './components/usage';
import DashboardContext from './config/dashboard-context';
import { DashboardProps } from './config/types';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardProps>({} as DashboardProps);
  const [loading, setLoading] = useState(false);

  const getDashboardData = async () => {
    try {
      setLoading(true);
      const res = await queryDashboardData();
      setData(res);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setData({} as DashboardProps);
    }
  };
  useEffect(() => {
    getDashboardData();
  }, []);
  return (
    <Spin spinning={loading}>
      <DashboardContext.Provider value={{ ...data }}>
        <Overview></Overview>
        <SystemLoad></SystemLoad>
        <Usage></Usage>
        <ActiveTable></ActiveTable>
      </DashboardContext.Provider>
    </Spin>
  );
};

export default Dashboard;
