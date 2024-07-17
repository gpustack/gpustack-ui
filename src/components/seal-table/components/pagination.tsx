import { Pagination, type PaginationProps } from 'antd';
import { memo } from 'react';

const PaginationComponent: React.FC<PaginationProps> = (props) => {
  return <Pagination {...props} />;
};

export default memo(PaginationComponent);
