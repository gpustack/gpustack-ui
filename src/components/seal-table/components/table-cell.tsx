import classNames from 'classnames';
import React from 'react';
import styled from 'styled-components';
import { SealColumnProps } from '../types';
import CellContent from './cell-content';

const CellWrapper = styled.div`
  padding: var(--ant-table-cell-padding-block)
    var(--ant-table-cell-padding-inline);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 68px;
  word-break: break-word;
  min-width: 20px;
  overflow: hidden;

  &.left {
    justify-content: flex-start;
  }

  &.right {
    justify-content: flex-end;
  }

  &.center {
    justify-content: center;
  }
`;

const TableCell: React.FC<SealColumnProps> = (props) => {
  const { dataIndex, render, align, editable, dataField } = props;

  return (
    <CellWrapper
      className={classNames('cell', {
        left: align === 'left',
        center: align === 'center',
        right: align === 'right'
      })}
    >
      <CellContent
        dataIndex={dataField || dataIndex}
        render={render}
        editable={editable}
      ></CellContent>
    </CellWrapper>
  );
};

export default TableCell;
