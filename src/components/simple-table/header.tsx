import { useIntl } from '@umijs/max';
import React from 'react';

interface TableHeaderProps {
  columns: any[];
}
interface TableHeaderProps {
  columns: any[];
}
const TableHeader = ({ columns }: TableHeaderProps) => {
  const intl = useIntl();
  return (
    <tr>
      {columns.map((column: any, index: number) => {
        return (
          <th key={index}>
            <span className="cell-span">
              {column.locale
                ? intl.formatMessage({ id: column.title })
                : column.title}
            </span>
          </th>
        );
      })}
    </tr>
  );
};
export default React.memo(TableHeader);
