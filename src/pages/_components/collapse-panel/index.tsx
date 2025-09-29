import IconFont from '@/components/icon-font';
import { Collapse, CollapseProps } from 'antd';
import React from 'react';
import styled from 'styled-components';

const CollapseInner = styled(Collapse)`
  .ant-collapse-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px !important;
    padding-inline: 5px !important;
    padding-block: 8px !important;
    border-radius: var(--border-radius-base) !important;
    font-size: 14px !important;
    font-weight: 600 !important;

    &:hover {
      background-color: var(--ant-color-fill-tertiary) !important;
    }
  }

  .ant-collapse-content-box {
    padding-inline: 0 !important;
    padding-block: 0 !important;
  }
  .ant-collapse-header-text {
    display: flex;
    align-items: center;
    height: 24px;
  }
`;

const CollapsePanel: React.FC<{ items: CollapseProps['items'] }> = ({
  items
}) => {
  return (
    <CollapseInner
      expandIconPosition="start"
      bordered={false}
      ghost
      accordion
      destroyOnHidden={false}
      expandIcon={({ isActive }) => (
        <IconFont
          type="icon-down"
          rotate={isActive ? 0 : -90}
          style={{ fontSize: '14px' }}
        ></IconFont>
      )}
      items={items}
    ></CollapseInner>
  );
};

export default CollapsePanel;
