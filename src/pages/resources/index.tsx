import { DeploymentUnitOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import type { TabsProps } from 'antd';
import { Button } from 'antd';
import { useCallback, useState } from 'react';
import styled from 'styled-components';
import GPUs from './components/gpus';
import ResourceOverview from './components/resource-overview';
import Workers from './components/workers';

const Wrapper = styled.div`
  .ant-page-header-heading {
    padding-inline: 8px;
  }
`;

const items: TabsProps['items'] = [
  {
    key: 'workers',
    label: 'Workers',
    children: <Workers />
  },
  {
    key: 'gpus',
    label: 'GPUs',
    children: <GPUs />
  },
  {
    key: 'overview',
    label: 'Resource Overview',
    children: <ResourceOverview />
  }
];
const Resources = () => {
  const [activeKey, setActiveKey] = useState('workers');

  const intl = useIntl();

  const handleChangeTab = useCallback((key: string) => {
    setActiveKey(key);
  }, []);

  return (
    <Wrapper>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'resources.title' }),
          style: {
            paddingInline: 'var(--layout-content-inlinepadding)'
          }
        }}
        tabList={items}
        onTabChange={handleChangeTab}
        tabActiveKey={activeKey}
        tabProps={{
          type: 'card',
          style: {
            marginTop: 78
          }
        }}
        tabBarExtraContent={
          <Button
            size="middle"
            type="primary"
            icon={<DeploymentUnitOutlined />}
          >
            Resource Overview
          </Button>
        }
      ></PageContainer>
    </Wrapper>
  );
};

export default Resources;
