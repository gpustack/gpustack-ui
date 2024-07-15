import { PageContainer } from '@ant-design/pro-components';
import { Spin } from 'antd';
import { StrictMode, memo, useState } from 'react';
import DashboardInner from './components/dahboard-inner';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);

  return (
    <StrictMode>
      <PageContainer ghost extra={[]}>
        <Spin spinning={loading}>
          <DashboardInner setLoading={setLoading} />
        </Spin>
      </PageContainer>
    </StrictMode>
  );
};

export default memo(Dashboard);
