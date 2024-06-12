import classNames from 'classnames';
import React from 'react';
import '../styles/header.less';
import { TableHeaderProps } from '../types';

const TableHeader: React.FC<TableHeaderProps> = (props) => {
  const { title, style, align, firstCell, lastCell } = props;
  return (
    <div
      style={{ ...style }}
      className={classNames('table-header', {
        'table-header-left': align === 'left',
        'table-header-center': align === 'center',
        'table-header-right': align === 'right',
        'table-header-first': firstCell,
        'table-header-last': lastCell
      })}
    >
      <div className="table-header-cell">{title}</div>
    </div>
  );
};

export default React.memo(TableHeader);
