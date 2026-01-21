import React from 'react';
import { useDetailContext } from '../../config/detail-context';

const Configure: React.FC = () => {
  const { detailData } = useDetailContext();
  return <div>Configure Content</div>;
};

export default Configure;
