import XTerminal from '@/components/x-terminal';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { TerminalProps } from './types';

const TabsContainer = styled.div`
  .ant-tabs {
    .ant-tabs-tab {
      positon: relative;
      &::after {
        content: '';
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 1px;
        border-right: 1px solid var(--ant-color-split);
        height: 20px;
      }
    }
  }
  .ant-tabs-nav {
    .ant-tabs-tab {
      border: none;
      background-color: transparent;

      .ant-tabs-tab-remove {
        display: none;
      }

      &:hover {
        .ant-tabs-tab-remove {
          display: inline-block;
        }
      }
    }

    .ant-tabs-tab:not(.ant-tabs-tab-active) {
      color: var(--ant-color-text-secondary);
    }

    .ant-tabs-tab-active {
      background-color: var(--ant-color-bg-elevated);
      color: var(--ant-color-text);
    }
  }
`;

export interface TerminalTabsProps {
  terminals: TerminalProps[];
  height: number;
  currentActive?: string;
  onClose: () => void;
}

const TerminalTabs: React.FC<TerminalTabsProps> = ({
  terminals,
  height,
  currentActive,
  onClose
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
    <TabsContainer>
      <Tabs
        type="editable-card"
        hideAdd
        activeKey={activeKey}
        onChange={setActiveKey}
        tabBarStyle={{ marginBottom: 0 }}
        items={items}
        tabBarExtraContent={{
          right: (
            <Button
              icon={<CloseOutlined />}
              type="text"
              size="small"
              onClick={onClose}
            ></Button>
          )
        }}
      ></Tabs>
    </TabsContainer>
  );
};

export default TerminalTabs;
