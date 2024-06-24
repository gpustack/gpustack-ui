import ActiveTable from './components/active-table';
import Overview from './components/over-view';
import SystemLoad from './components/system-load';
import Usage from './components/usage';

const Dashboard: React.FC = () => {
  return (
    <>
      <Overview></Overview>
      <SystemLoad></SystemLoad>
      <Usage></Usage>
      <ActiveTable></ActiveTable>
    </>
  );
};

export default Dashboard;
