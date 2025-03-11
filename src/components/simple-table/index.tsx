import useOverlayScroller from '@/hooks/use-overlay-scroller';
import classNames from 'classnames';
import React from 'react';
import 'simplebar-react/dist/simplebar.min.css';
import TableHeader from './header';
import './index.less';
import TableRow from './row';

export interface ColumnProps {
  title: string;
  key: string;
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
  columns: ColumnProps[];
  dataSource: any[];
  bordered?: boolean;
  rowKey?: string;
}
const SimpleTabel: React.FC<SimpleTableProps> = (props) => {
  const { columns, dataSource, rowKey, bordered = true } = props;
  const scroller = React.useRef<any>(null);
  const { initialize } = useOverlayScroller();

  React.useEffect(() => {
    initialize(scroller.current);
  }, [initialize]);
  return (
    <div style={{ maxHeight: 200 }} ref={scroller}>
      <table
        className={classNames('simple-table', {
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
                key={rowKey ? item[rowKey] : index}
              ></TableRow>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(SimpleTabel);
