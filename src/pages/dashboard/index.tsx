import DividerLine from '@/components/divider-line';
import { PageContainer } from '@ant-design/pro-components';
import ActiveTable from './components/active-table';
import Overview from './components/over-view';
import SystemLoad from './components/system-load';
import Usage from './components/usage';

const Dashboard: React.FC = () => {
  return (
    <>
      <PageContainer ghost title={false}>
        <Overview></Overview>
      </PageContainer>
      <DividerLine></DividerLine>
      <PageContainer ghost title="System Load">
        <SystemLoad></SystemLoad>
      </PageContainer>
      <DividerLine></DividerLine>
      <Usage></Usage>
      <DividerLine></DividerLine>
      <ActiveTable></ActiveTable>
    </>
  );
};

export default Dashboard;
