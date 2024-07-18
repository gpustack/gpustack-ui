import classNames from 'classnames';
import React, { useContext } from 'react';
import RowContext from '../row-context';
import '../styles/cell.less';
import { SealColumnProps } from '../types';

const SealColumn: React.FC<SealColumnProps> = (props) => {
  const row: Record<string, any> = useContext(RowContext);
  console.log('seal column====', row);
  const { dataIndex, render, align } = props;
  return (
    <div
      className={classNames('cell', {
        'cell-left': align === 'left',
        'cell-center': align === 'center',
        'cell-right': align === 'right'
      })}
    >
      <span className="cell-content">
        {render
          ? render(row[dataIndex], { ...row, dataIndex })
          : row[dataIndex]}
      </span>
    </div>
  );
};

export default React.memo(SealColumn);
