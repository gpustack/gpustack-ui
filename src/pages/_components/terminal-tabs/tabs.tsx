import XTerminal from '@/components/x-terminal';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Tabs } from 'antd';
import { throttle } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import ResizeContainer from './resize-container';
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

      .ant-tabs-tab-remove .anticon-close {
        // display: none;
        height: 0;
        overflow: hidden;
        transition: all 0.3s;
      }

      &::before {
        display: none;
        content: '';
        left: 5px;
        top: 5px;
        bottom: 5px;
        right: 5px;
        position: absolute;
        border-radius: 4px;
        background-color: var(--ant-color-fill-tertiary);
      }

      &:hover {
        &::before {
          display: block;
        }
        .ant-tabs-tab-remove .anticon-close {
          // display: inline-block;
          height: auto;
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
  currentActive?: string;
  onClose: () => void;
}

const TerminalTabs: React.FC<TerminalTabsProps> = ({
  terminals,
  currentActive,
  onClose
}) => {
  const [activeKey, setActiveKey] = useState(
    currentActive || terminals[0]?.url || ''
  );
  const [height, setHeight] = useState(300);
  const resizeRef = React.useRef<any>(null);

  const items = useMemo(() => {
    return terminals.map((terminal) => {
      return {
        key: terminal.url,
        label: terminal.name,
        children: <XTerminal height={height} url={terminal.url} />
      };
    });
  }, [terminals, height]);

  const handleOnResize = throttle(() => {
    const newHeight = resizeRef.current?.container?.state?.height;
    console.log('newHeight', newHeight);
    setHeight(newHeight - 43); // 43 is the height of the tabs header
  }, 200);

  useEffect(() => {
    if (currentActive) {
      setActiveKey(currentActive);
    }
  }, [currentActive]);

  return (
    <ResizeContainer onReSize={handleOnResize} ref={resizeRef}>
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
                style={{ marginRight: 8 }}
                onClick={onClose}
              ></Button>
            )
          }}
        ></Tabs>
      </TabsContainer>
    </ResizeContainer>
  );
};

export default TerminalTabs;
