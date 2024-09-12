import classNames from 'classnames';
import React from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import TableHeader from './header';
import './index.less';
import TableRow from './row';

interface SimpleTableProps {
  columns: any[];
  dataSource: any[];
  bordered?: boolean;
  rowKey?: string;
}
const SimpleTabel: React.FC<SimpleTableProps> = (props) => {
  const { columns, dataSource, rowKey, bordered = true } = props;
  return (
    <SimpleBar style={{ maxHeight: 200 }}>
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
                columns={columns}
                key={rowKey ? item[rowKey] : index}
              ></TableRow>
            );
          })}
        </tbody>
      </table>
    </SimpleBar>
  );
};

export default React.memo(SimpleTabel);
