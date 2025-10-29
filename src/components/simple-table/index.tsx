import classNames from 'classnames';
import React from 'react';
import 'simplebar-react/dist/simplebar.min.css';
import TableHeader from './header';
import './index.less';
import TableRow from './row';

export interface ColumnProps {
  title: string;
  key: string;
  width?: string | number;
  style?: React.CSSProperties;
  render?: (data: {
    dataIndex: string;
    dataList?: any[];
    row: any;
    rowIndex?: number;
    colIndex?: number;
  }) => any;
  locale?: boolean;
  colSpan?: (params: {
    row: any;
    rowIndex: number;
    colIndex: number;
    dataIndex: string;
    dataList: any[];
  }) => number;
  rowSpan?: (params: {
    row: any;
    rowIndex: number;
    colIndex: number;
    dataIndex: string;
    dataList: any[];
  }) => number;
}

interface SimpleTableProps {
  theme?: 'dark' | 'light';
  maxHeight?: number | string;
  columns: ColumnProps[];
  dataSource: any[];
  bordered?: boolean;
  rowKey: string;
}
const SimpleTabel: React.FC<SimpleTableProps> = (props) => {
  const { columns, dataSource, rowKey, theme, bordered = true } = props;

  return (
    <div>
      <table
        className={classNames('simple-table', theme, {
          'simple-table-bordered': bordered
        })}
      >
        <thead>
          <TableHeader columns={columns}></TableHeader>
        </thead>
        <tbody>
          {dataSource.map((item: any, index: number) => {
            return (
              <TableRow
                row={item}
                rowIndex={index}
                columns={columns}
                dataList={dataSource}
                key={item[rowKey]}
              ></TableRow>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SimpleTabel;
