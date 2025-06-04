import PageTools from '@/components/page-tools';
import { SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Select, Space } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { queryDashboardData } from '../apis';
import DashboardContext from '../config/dashboard-context';
import { DashboardProps } from '../config/types';
import ActiveTable from './active-table';
import Overview from './over-view';
import Usage from './usage';

const Page: React.FC<{ setLoading: (loading: boolean) => void }> = ({
  setLoading
}) => {
  const intl = useIntl();
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
      <PageTools
        left={
          <Space>
            <Input
              placeholder={intl.formatMessage({ id: 'usage.filter.user' })}
              style={{ width: 200 }}
              allowClear
            ></Input>
            <Select
              style={{ width: 300 }}
              placeholder={intl.formatMessage({ id: 'usage.filter.model' })}
            ></Select>
            <Button
              type="text"
              style={{ color: 'var(--ant-color-text-tertiary)' }}
              icon={<SyncOutlined></SyncOutlined>}
            ></Button>
          </Space>
        }
      ></PageTools>
      <Usage></Usage>
      <ActiveTable></ActiveTable>
    </DashboardContext.Provider>
  );
};

export default memo(Page);
