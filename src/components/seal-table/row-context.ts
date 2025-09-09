import React from 'react';

interface RowContextType {
  row: Record<string, any>;
  onCell?: (record: any, dataIndex: string) => any;
}

const RowContext = React.createContext<RowContextType>({} as RowContextType);

export default RowContext;
