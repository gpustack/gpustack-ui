import React from 'react';
import { useDetailContext } from '../../config/detail-context';

const Summary: React.FC = () => {
  const { detailData } = useDetailContext();
  return <div>Summary Content</div>;
};

export default Summary;
