import React from 'react';

interface TableRowProps {
  row: any;
  columns: any;
}
const TableRow = ({ row, columns }: TableRowProps) => {
  return (
    <tr>
      {columns.map((column: any, index: number) => {
        return (
          <td key={index}>
            <span className="cell-span">
              {column.render
                ? column.render({ dataIndex: column.key, row: row })
                : row[column.key]}
            </span>
          </td>
        );
      })}
    </tr>
  );
};

export default React.memo(TableRow);
