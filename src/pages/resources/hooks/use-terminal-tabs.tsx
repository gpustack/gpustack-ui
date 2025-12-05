import { useState } from 'react';
import TerminalTabs from '../../_components/terminal-tabs';

const useTerminalTabs = () => {
  const [terminals, setTerminals] = useState<{ url: string; name: string }[]>(
    []
  );
  const [terminalModalStatus, setTerminalModalStatus] = useState<{
    open: boolean;
    currentActive: string;
  }>({
    open: false,
    currentActive: ''
  });

  const handleTerminalClose = () => {
    setTerminalModalStatus({ open: false, currentActive: '' });
    setTerminals([]);
  };

  const handleAddTerminal = (record: { id: number; name: string }) => {
    const url = `/api/workers/${record.id}/terminal`;
    setTerminals((prev) => {
      return [
        ...prev,
        {
          url,
          name: record.name
        }
      ];
    });
    setTerminalModalStatus({ open: true, currentActive: url });
  };

  const TerminalPanel = (
    <TerminalTabs
      key="terminal-tabs"
      terminals={terminals}
      open={terminalModalStatus.open}
      currentActive={terminalModalStatus.currentActive}
      onClose={handleTerminalClose}
    />
  );

  return {
    TerminalPanel,
    terminals,
    handleAddTerminal
  };
};

export default useTerminalTabs;
