import { PageContainer } from '@ant-design/pro-components';

const Dashboard: React.FC = () => {
  return (
    <PageContainer
      ghost
      header={{
        title: 'Dashboard',
      }}
    >
      <div>Models</div>
    </PageContainer>
  );
};

export default Dashboard;