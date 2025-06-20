import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import '../styles/header.less';

import { TableHeaderProps } from '../types';

const TableHeader: React.FC<TableHeaderProps> = (props) => {
  const {
    title,
    style,
    align,
    firstCell,
    lastCell,
    sortOrder,
    onSort,
    sorter,
    dataIndex
  } = props;

  const handleOnSort = () => {
    if (sortOrder === 'ascend') {
      onSort?.(dataIndex, 'descend');
    } else {
      onSort?.(dataIndex, 'ascend');
    }
  };
  return (
    <div
      style={{ ...style }}
      className={classNames('table-header', {
        'table-header-left': align === 'left',
        'table-header-center': align === 'center',
        'table-header-right': align === 'right',
        'table-header-first': firstCell,
        'table-header-last': lastCell,
        'table-header-sorter': sorter
      })}
    >
      {sorter ? (
        <span className="sorter-header" onClick={handleOnSort}>
          <span className="table-header-cell">{title}</span>
          <span className="sorter">
            <CaretUpOutlined
              className={classNames('sorter-up', {
                'sorter-active': sortOrder === 'ascend'
              })}
            ></CaretUpOutlined>
            <CaretDownOutlined
              className={classNames('sorter-down', {
                'sorter-active': sortOrder === 'descend'
              })}
            ></CaretDownOutlined>
          </span>
        </span>
      ) : (
        <div className="table-header-cell">{title}</div>
      )}
    </div>
  );
};

export default TableHeader;
