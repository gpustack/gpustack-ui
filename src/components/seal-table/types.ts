import React from 'react';

export type OnSortFn = (
  order: {
    columnKey: string;
    field: string;
    order: 'ascend' | 'descend' | null;
  },
  sorter: boolean | { multiple?: number }
) => void;

export interface CellContentProps {
  dataIndex: string;
  render?: (text: any, record: any) => React.ReactNode;
  editable?:
    | boolean
    | {
        valueType?: 'text' | 'number' | 'date' | 'datetime' | 'time';
        title?: React.ReactNode;
      };
}

export interface SealColumnProps {
  title: React.ReactNode;
  render?: (text: any, record: any) => React.ReactNode;
  dataIndex: string;
  key?: string;
  dataField?: string; // Added dataField property, aviods conflict with dataIndex, because dataIndex maybe used in sorting
  width?: number;
  span: number;
  align?: 'left' | 'center' | 'right';
  headerStyle?: React.CSSProperties;
  sorter?: boolean | { multiple?: number };
  defaultSortOrder?: 'ascend' | 'descend';
  editable?:
    | boolean
    | {
        valueType?: 'text' | 'number' | 'date' | 'datetime' | 'time';
        title?: React.ReactNode;
      };
  valueType?: 'text' | 'number' | 'date' | 'datetime' | 'time';
  sortOrder?: 'ascend' | 'descend' | null;
  [key: string]: any;
}

export interface TableHeaderProps {
  showSorterTooltip?: boolean;
  sorterList?: TableOrder | Array<TableOrder>;
  sorter?: boolean | { multiple?: number };
  sortDirections?: ('ascend' | 'descend' | null)[];
  defaultSortOrder?: 'ascend' | 'descend' | null;
  sortOrder?: 'ascend' | 'descend' | null;
  dataIndex: string;
  onSort?: OnSortFn;
  title: React.ReactNode;
  style?: React.CSSProperties;
  firstCell?: boolean;
  lastCell?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  sortedDataIndexList?: Array<{
    columnKey: string;
    field: string;
    order: 'ascend' | 'descend' | null;
  }>;
}

export interface RowSelectionProps {
  selectedRowKeys: React.Key[];
  selectedRows: any[];
  enableSelection: boolean;
  removeSelectedKeys: (rowKeys: React.Key[]) => void;
  onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => void;
}

export type TableOrder = {
  columnKey?: string;
  field?: string;
  order: 'ascend' | 'descend' | null;
};
export interface SealTableProps {
  showSorterTooltip?: boolean;
  sortDirections?: ('ascend' | 'descend' | null)[];
  columns?: SealColumnProps[];
  childParentKey?: string;
  expandedRowKeys?: React.Key[];
  rowSelection?: RowSelectionProps;
  children?: React.ReactElement<SealColumnProps>[];
  empty?: React.ReactNode;
  expandable?: React.ReactNode;
  dataSource: any[];
  pollingChildren?: boolean;
  watchChildren?: boolean;
  loading?: boolean;
  loadend?: boolean;
  onCell?: (record: any, extra: any) => void;
  onTableSort?: (order: TableOrder | Array<TableOrder>) => void;
  onExpand?: (expanded: boolean, record: any, rowKey: any) => void;
  onExpandAll?: (expanded: boolean) => void;
  renderChildren?: (
    data: any,
    options: { parent?: any; [key: string]: any }
  ) => React.ReactNode;
  loadChildren?: (record: any, options?: any) => Promise<any[]>;
  loadChildrenAPI?: (record: any) => string;
  contentRendered?: () => void;
  rowKey: string;
}

export interface RowContextProps {
  record: Record<string, any>;
  pollingChildren?: boolean;
  rowIndex: number;
}
