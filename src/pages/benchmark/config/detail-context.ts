import { createContext, useContext } from 'react';

interface DetailContextProps {
  detailData: any;
  id: number;
  loading?: boolean;
}

const DetailContext = createContext<DetailContextProps>(
  {} as DetailContextProps
);

export const useDetailContext = () => {
  const context = useContext(DetailContext);
  if (!context) {
    throw new Error('useDetailContext must be used within a DetailProvider');
  }
  return context;
};

export default DetailContext;
