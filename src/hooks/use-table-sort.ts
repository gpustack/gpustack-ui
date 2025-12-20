import type { SortOrder } from 'antd/es/table/interface';
import { useState } from 'react';

export default function useTableSort({
  defaultSortOrder = 'descend'
}: {
  defaultSortOrder?: SortOrder;
}) {
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);

  const handleSortChange = (order: SortOrder) => {
    if (order) {
      setSortOrder(order);
    } else if (defaultSortOrder === 'descend') {
      setSortOrder('ascend');
    } else if (defaultSortOrder === 'ascend') {
      setSortOrder('descend');
    }
  };

  return {
    sortOrder,
    setSortOrder: handleSortChange
  };
}

type orderType = {
  columnKey?: string;
  field?: string;
  order: SortOrder;
};

export function useTableMultiSort() {
  const [sortOrder, setSortOrder] = useState<string[]>([]);

  const handleMultiSortChange = (order: orderType | orderType[]) => {
    const sortOrders = Array.isArray(order) ? order : [order];
    const sortOrderMap: string[] = [];
    sortOrders.forEach((item) => {
      const key = item.columnKey || item.field;
      if (key) {
        sortOrderMap.push(item.order === 'descend' ? `-${key}` : key);
      }
    });

    setSortOrder(sortOrderMap);
    return sortOrderMap;
  };

  return {
    sortOrder,
    handleMultiSortChange
  };
}
