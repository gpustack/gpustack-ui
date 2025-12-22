import { isBoolean } from 'lodash';
import { useRef, useState } from 'react';
import { SealColumnProps, TableOrder } from './types';

const initSorterList = (columns: SealColumnProps[]) => {
  const list = columns.filter((col) => col.defaultSortOrder);
  if (list.length === 0) {
    return [];
  }

  return list.map((col) => ({
    columnKey: col.key || col.dataIndex,
    field: col.dataIndex,
    order: col.defaultSortOrder || null
  }));
};

export default function useSorter(options: {
  onTableSort?: (TableOrder: TableOrder | Array<TableOrder>) => void;
  columns?: SealColumnProps[];
}) {
  const { onTableSort, columns } = options;
  const sorterListRef = useRef<TableOrder | Array<TableOrder>>(
    initSorterList(columns || [])
  );
  const [sorterList, setSorterList] = useState<TableOrder | Array<TableOrder>>(
    initSorterList(columns || [])
  );

  const handleOnTableSort = (
    order: TableOrder,
    sorter: boolean | { multiple?: number }
  ) => {
    let currentOrder: TableOrder = { ...order };

    if (order.order === null) {
      currentOrder = {
        columnKey: undefined,
        field: undefined,
        order: null
      };
    }
    // single column sort
    if (isBoolean(sorter)) {
      setSorterList(currentOrder);
      sorterListRef.current = currentOrder;

      onTableSort?.(sorterListRef.current);
      return;
    }

    // multi column sort
    if (sorter && typeof sorter === 'object' && sorter.multiple) {
      if (!Array.isArray(sorterListRef.current)) {
        if (
          sorterListRef.current.columnKey === currentOrder.columnKey ||
          sorterListRef.current.field === currentOrder.field
        ) {
          // remove the sorter if order is null
          sorterListRef.current = {
            ...currentOrder
          };
        } else {
          sorterListRef.current = [sorterListRef.current, { ...currentOrder }];
        }
      } else if (Array.isArray(sorterListRef.current)) {
        const existingIndex = sorterListRef.current.findIndex(
          (item) =>
            item.columnKey === order.columnKey || item.field === order.field
        );

        if (existingIndex !== -1) {
          sorterListRef.current.splice(existingIndex, 1);
          sorterListRef.current.push({ ...currentOrder });
        } else {
          sorterListRef.current.push({ ...currentOrder });
        }
      }
    }
    setSorterList(sorterListRef.current);

    onTableSort?.(sorterListRef.current);
  };

  return {
    sorterListRef,
    sorterList,
    handleOnTableSort
  };
}
