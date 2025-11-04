import { Spin } from 'antd';
import { useState } from 'react';
import PageBox from '../_components/page-box';
import DashboardInner from './components/dahboard-inner';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);

  return (
    <>
      <PageBox>
        <Spin spinning={loading}>
          <DashboardInner setLoading={setLoading} />
        </Spin>
      </PageBox>
    </>
  );
};

export default Dashboard;
