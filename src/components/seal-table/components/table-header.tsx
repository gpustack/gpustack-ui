import AutoTooltip from '@/components/auto-tooltip';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import classNames from 'classnames';
import React, { useEffect } from 'react';
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
    sortDirections = ['ascend', 'descend', null],
    defaultSortOrder,
    onSort,
    sorterList,
    sorter = false,
    width,
    dataIndex
  } = props;
  const intl = useIntl();

  const [currentSortOrder, setCurrentSortOrder] = React.useState<
    'ascend' | 'descend' | null
  >(sortOrder || defaultSortOrder || null);

  const getNextSortOrder = (currentOrder: 'ascend' | 'descend' | null) => {
    const index = sortDirections.indexOf(currentOrder);
    const nextIndex = (index + 1) % sortDirections.length;
    return sortDirections[nextIndex];
  };

  const nextSortTips = () => {
    if (!currentSortOrder) {
      return intl.formatMessage({ id: 'common.sorter.tips.ascend' });
    }
    if (currentSortOrder === 'ascend') {
      return intl.formatMessage({ id: 'common.sorter.tips.descend' });
    }
    return intl.formatMessage({ id: 'common.sorter.tips.cancel' });
  };

  const handleOnSort = () => {
    setCurrentSortOrder((prev) => {
      const next = getNextSortOrder(prev);
      onSort?.(
        {
          columnKey: dataIndex,
          field: dataIndex,
          order: next
        },
        sorter
      );
      return next;
    });
  };

  useEffect(() => {
    if (!sorterList) {
      setCurrentSortOrder(null);
      return;
    }

    if (Array.isArray(sorterList)) {
      const sortItem = sorterList.find(
        (item) => item.columnKey === dataIndex || item.field === dataIndex
      );
      setCurrentSortOrder(sortItem?.order || null);
    } else {
      if (
        sorterList.columnKey === dataIndex ||
        sorterList.field === dataIndex
      ) {
        setCurrentSortOrder(sorterList.order);
      } else {
        setCurrentSortOrder(null);
      }
    }
  }, [sorterList]);

  return (
    <div
      style={{ width, ...style }}
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
          <AutoTooltip ghost>
            <span className="table-header-cell">{title}</span>
          </AutoTooltip>
          <span className="sorter">
            <CaretUpOutlined
              className={classNames('sorter-up', {
                'sorter-active': currentSortOrder === 'ascend'
              })}
            ></CaretUpOutlined>
            <CaretDownOutlined
              className={classNames('sorter-down', {
                'sorter-active': currentSortOrder === 'descend'
              })}
            ></CaretDownOutlined>
          </span>
        </span>
      ) : (
        <AutoTooltip ghost>
          <span className="table-header-cell">{title}</span>
        </AutoTooltip>
      )}
    </div>
  );
};

export default TableHeader;
