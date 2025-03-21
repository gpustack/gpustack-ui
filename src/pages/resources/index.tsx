import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import type { TabsProps } from 'antd';
import { useCallback, useState } from 'react';
import styled from 'styled-components';
import GPUs from './components/gpus';
import ModelFiles from './components/model-files';
import Workers from './components/workers';

const Wrapper = styled.div`
  .ant-page-header-heading {
    padding-inline: 8px;
  }
`;

const Resources = () => {
  const [activeKey, setActiveKey] = useState('workers');

  const intl = useIntl();

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
      key: 'model-files',
      label: intl.formatMessage({ id: 'resources.modelfiles.modelfile' }),
      children: <ModelFiles />
    }
  ];

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
        extra={[]}
      ></PageContainer>
    </Wrapper>
  );
};

export default Resources;
