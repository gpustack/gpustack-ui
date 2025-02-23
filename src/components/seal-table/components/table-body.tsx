import { Empty } from 'antd';
import React from 'react';
import { SealColumnProps } from '../types';
import TableRow from './table-row';

interface TableBodyProps {
  dataSource: any[];
  columns: SealColumnProps[];
  rowKey: string;
  rowSelection?: any;
  expandable?: any;
  expandedRowKeys?: any;
  onExpand?: any;
  childParentKey?: any;
  pollingChildren?: any;
  watchChildren?: any;
  renderChildren?: any;
  loadChildren?: any;
  loadChildrenAPI?: any;
  onCell?: any;
  empty?: React.ReactNode;
}

const TableBody: React.FC<TableBodyProps> = ({
  dataSource,
  rowKey,
  rowSelection,
  expandable,
  expandedRowKeys,
  onExpand,
  childParentKey,
  pollingChildren,
  watchChildren,
  renderChildren,
  loadChildren,
  loadChildrenAPI,
  columns,
  onCell,
  empty
}) => {
  if (!dataSource.length) {
    return (
      <div className="empty-wrapper">
        {empty || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      </div>
    );
  }

  return (
    <div className="seal-table-content">
      {dataSource.map((item, index) => (
        <TableRow
          key={item[rowKey]}
          record={item}
          rowIndex={index}
          columns={columns}
          rowSelection={rowSelection}
          expandable={expandable}
          rowKey={rowKey}
          childParentKey={childParentKey}
          pollingChildren={pollingChildren}
          watchChildren={watchChildren}
          renderChildren={renderChildren}
          loadChildren={loadChildren}
          loadChildrenAPI={loadChildrenAPI}
          onCell={onCell}
          onExpand={onExpand}
          expandedRowKeys={expandedRowKeys}
        />
      ))}
    </div>
  );
};

export default TableBody;
