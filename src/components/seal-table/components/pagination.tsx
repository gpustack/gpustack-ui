import { Pagination, type PaginationProps } from 'antd';

const PaginationComponent: React.FC<PaginationProps> = (props) => {
  return <Pagination {...props} />;
};

export default PaginationComponent;
