import './footer.less';
import TerminalTabs from './tabs';

export interface TerminalModalProps {
  terminals: { url: string; name: string }[];
  height: number;
  open: boolean;
  onClose: () => void;
  currentActive?: string;
}

const TerminalModal: React.FC<TerminalModalProps> = ({
  terminals,
  height,
  open,
  onClose,
  currentActive
}) => {
  return (
    <div>
      <TerminalTabs
        terminals={terminals}
        height={height}
        currentActive={currentActive}
        onClose={onClose}
      />
    </div>
  );
};

export default TerminalModal;
