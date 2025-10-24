import React from 'react';

interface RowContextType {
  row: Record<string, any>;
  onCell?: (
    record: any,
    data: { dataIndex: string; newValue: any; oldValue: any }
  ) => any;
}

const RowContext = React.createContext<RowContextType>({} as RowContextType);

export default RowContext;
