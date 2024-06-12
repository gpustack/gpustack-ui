import React from 'react';

export interface SealColumnProps {
  title: string;
  render?: (text: any, record: any) => React.ReactNode;
  dataIndex: string;
  width?: number;
  span: number;
  align?: 'left' | 'center' | 'right';
  headerStyle?: React.CSSProperties;
}

export interface TableHeaderProps {
  children?: React.ReactNode;
  title: string;
  style?: React.CSSProperties;
  firstCell?: boolean;
  lastCell?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface RowSelectionProps {
  selectedRowKeys: React.Key[];
  onChange: (selectedRowKeys: React.Key[]) => void;
}
export interface SealTableProps {
  rowSelection?: RowSelectionProps;
  children: React.ReactNode[];
  empty?: React.ReactNode;
  expandable?: React.ReactNode;
  dataSource: any[];
  loading?: boolean;
  onExpand?: (expanded: boolean, record: any) => void;
  rowKey: string;
}

export interface RowContextProps {
  record: Record<string, any>;
  columns: React.ReactNode[];
  rowIndex: number;
}