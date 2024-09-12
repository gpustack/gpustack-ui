import React from 'react';

interface TableHeaderProps {
  columns: any[];
}
interface TableHeaderProps {
  columns: any[];
}
const TableHeader = ({ columns }: TableHeaderProps) => {
  return (
    <tr>
      {columns.map((column: any, index: number) => {
        return (
          <th key={index}>
            <span className="cell-span">{column.title}</span>
          </th>
        );
      })}
    </tr>
  );
};
export default React.memo(TableHeader);
