import React, { useMemo } from 'react';

interface TableRowProps {
  row: any;
  columns: any;
  rowIndex: number;
  dataList: any[];
}

interface TableCellProps {
  row: any;
  column: any;
  rowIndex: number;
  colIndex: number;
  dataList: any[];
}
const TableCell: React.FC<TableCellProps> = (props: TableCellProps) => {
  const { row, column, rowIndex, colIndex, dataList } = props;

  const renderContent = useMemo(() => {
    return column.render
      ? column.render({
          dataIndex: column.key,
          dataList: dataList,
          row: row,
          rowIndex,
          colIndex: colIndex
        })
      : row[column.key];
  }, [column, row, rowIndex, colIndex, dataList]);

  if (renderContent === null && (column.colSpan || column.rowSpan)) {
    return null;
  }

  return (
    <td
      width={column.width}
      key={colIndex}
      rowSpan={column.rowSpan?.({
        row,
        rowIndex,
        colIndex: colIndex,
        dataIndex: column.key,
        dataList: dataList
      })}
      colSpan={column.colSpan?.({
        row,
        rowIndex,
        colIndex: colIndex,
        dataIndex: column.key,
        dataList: dataList
      })}
    >
      <span className="cell-span">
        {column.render
          ? column.render({
              dataIndex: column.key,
              dataList: dataList,
              row: row,
              rowIndex,
              colIndex: colIndex
            })
          : row[column.key]}
      </span>
    </td>
  );
};

const TableRow = ({ row, columns, rowIndex, dataList }: TableRowProps) => {
  return (
    <tr>
      {columns.map((column: any, index: number) => {
        return (
          <TableCell
            key={index}
            rowIndex={rowIndex}
            colIndex={index}
            dataList={dataList}
            row={row}
            column={column}
          ></TableCell>
        );
      })}
    </tr>
  );
};

export default TableRow;
