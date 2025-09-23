import XTerminal from '@/components/x-terminal';
import { Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { TerminalProps } from './types';

export interface TerminalTabsProps {
  terminals: TerminalProps[];
  height: number;
  currentActive?: string;
}

const TerminalTabs: React.FC<TerminalTabsProps> = ({
  terminals,
  height,
  currentActive
}) => {
  const [activeKey, setActiveKey] = useState(
    currentActive || terminals[0]?.url || ''
  );

  const items = useMemo(() => {
    return terminals.map((terminal) => {
      return {
        key: terminal.url,
        label: terminal.name,
        children: <XTerminal height={height} url={terminal.url} />
      };
    });
  }, [terminals]);

  useEffect(() => {
    if (currentActive) {
      setActiveKey(currentActive);
    }
  }, [currentActive]);

  return (
    <Tabs
      type="editable-card"
      hideAdd
      activeKey={activeKey}
      onChange={setActiveKey}
      tabBarStyle={{ marginBottom: 0 }}
      items={items}
    ></Tabs>
  );
};

export default TerminalTabs;
