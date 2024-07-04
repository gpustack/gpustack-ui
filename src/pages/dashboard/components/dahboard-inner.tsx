import { memo, useCallback, useEffect, useState } from 'react';
import { queryDashboardData } from '../apis';
import DashboardContext from '../config/dashboard-context';
import { DashboardProps } from '../config/types';
import ActiveTable from './active-table';
import Overview from './over-view';
import SystemLoad from './system-load';
import Usage from './usage';

const Dashboard: React.FC<{ setLoading: (loading: boolean) => void }> = ({
  setLoading
}) => {
  const [data, setData] = useState<DashboardProps>({} as DashboardProps);

  const getDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await queryDashboardData();
      setData(res);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setData({} as DashboardProps);
    }
  }, []);
  useEffect(() => {
    getDashboardData();
  }, []);
  return (
    <DashboardContext.Provider value={{ ...data, fetchData: getDashboardData }}>
      <Overview></Overview>
      <SystemLoad></SystemLoad>
      <Usage></Usage>
      <ActiveTable></ActiveTable>
    </DashboardContext.Provider>
  );
};

export default memo(Dashboard);
