import { Checkbox } from 'antd';
import '../styles/skeleton.less';

const RowSkeleton = () => {
  return (
    <div className="row-skeleton">
      <div className="holder"></div>
      <Checkbox></Checkbox>
    </div>
  );
};

export default RowSkeleton;
