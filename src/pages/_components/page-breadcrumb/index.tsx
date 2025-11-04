import IconFont from '@/components/icon-font';
import { Breadcrumb, type BreadcrumbProps } from 'antd';
import React from 'react';
import styled from 'styled-components';

const StyledBreadcrumb = styled(Breadcrumb)`
  .ant-breadcrumb-link {
    font-size: 16px;
    font-weight: 500;
    a {
      background: unset;
    }
  }
  .ant-breadcrumb-separator {
    display: flex;
    align-items: center;
  }
`;

const App: React.FC<BreadcrumbProps> = ({ items }) => (
  <StyledBreadcrumb
    separator={<IconFont type="icon-down2" rotate={-90} />}
    items={items}
  />
);

export default App;
