import { PageContainer } from '@ant-design/pro-components';
import { Access, useAccess } from '@umijs/max';
import { Button } from 'antd';

const Dashboard: React.FC = () => {
  const access = useAccess();
  return (
    <PageContainer
      ghost
      header={{
        title: 'Dashboard',
      }}
    >
      <Access accessible={access.canSeeAdmin}>
        <Button type="primary">==================</Button>
      </Access>
    </PageContainer>
  );
};

export default Dashboard;