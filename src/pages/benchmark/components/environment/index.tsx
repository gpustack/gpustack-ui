import React from 'react';
import { useDetailContext } from '../../config/detail-context';

const Environment: React.FC = () => {
  const { detailData } = useDetailContext();
  return <div>Environment Content</div>;
};

export default Environment;
