import FormDrawer from '@/pages/_components/form-drawer';
import { BenchmarkListItem } from '../config/types';
import DetailContent from './detail-content';

interface DetailModalProps {
  open: boolean;
  currentData?: BenchmarkListItem;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({
  open,
  currentData,
  onClose
}) => {
  return (
    <FormDrawer
      title={currentData?.name}
      open={open}
      onCancel={onClose}
      width={700}
      footer={null}
    >
      <DetailContent currentData={currentData} />
    </FormDrawer>
  );
};

export default DetailModal;
