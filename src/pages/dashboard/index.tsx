import { PageContainer } from '@ant-design/pro-components';
import { Spin } from 'antd';
import { memo, useState } from 'react';
import DashboardInner from './components/dahboard-inner';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);

  return (
    <>
      <PageContainer
        ghost
        extra={[]}
        header={{
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          }
        }}
      >
        <Spin spinning={loading}>
          <DashboardInner setLoading={setLoading} />
        </Spin>
      </PageContainer>
    </>
  );
};

export default memo(Dashboard);
