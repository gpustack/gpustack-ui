import ActiveTable from './active-table';
import Overview from './over-view';
import SystemLoad from './system-load';
import Usage from './usage';

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
