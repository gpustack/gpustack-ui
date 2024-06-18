import DividerLine from '@/components/divider-line';
import ActiveTable from './components/active-table';
import Overview from './components/over-view';
import SystemLoad from './components/system-load';
import Usage from './components/usage';

const Dashboard: React.FC = () => {
  return (
    <>
      <Overview></Overview>
      <DividerLine></DividerLine>
      <SystemLoad></SystemLoad>
      <DividerLine></DividerLine>
      <Usage></Usage>
      <DividerLine></DividerLine>
      <ActiveTable></ActiveTable>
    </>
  );
};

export default Dashboard;
