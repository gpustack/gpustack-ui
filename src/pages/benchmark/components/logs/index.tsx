import React from 'react';
import { useDetailContext } from '../../config/detail-context';

const Logs: React.FC = () => {
  const { id } = useDetailContext();
  return <div>Logs Content</div>;
};

export default Logs;
