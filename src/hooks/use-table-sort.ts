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
