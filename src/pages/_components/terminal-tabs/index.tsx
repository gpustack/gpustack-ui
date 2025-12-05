import './footer.less';
import TerminalTabs from './tabs';

export interface TerminalModalProps {
  terminals: { url: string; name: string }[];
  open: boolean;
  onClose: () => void;
  currentActive?: string;
}

const TerminalModal: React.FC<TerminalModalProps> = ({
  terminals,
  open,
  onClose,
  currentActive
}) => {
  return (
    <TerminalTabs
      terminals={terminals}
      currentActive={currentActive}
      onClose={onClose}
    />
  );
};

export default TerminalModal;
