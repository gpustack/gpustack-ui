import useTabActive from '@/hooks/use-tab-active';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { TabsProps } from 'antd';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import CustomUI from './components/custom-ui';
import ModifyPasswordn from './components/modify-password';

const Wrapper = styled.div`
  .ant-page-header-heading {
    padding-inline: 8px;
  }
`;

const Profile: React.FC = () => {
  const intl = useIntl();
  const { setTabActive, getTabActive, tabsMap } = useTabActive();
  const [activeKey, setActiveKey] = useState(
    getTabActive(tabsMap.userSettings) || 'modify-password'
  );

  const items: TabsProps['items'] = [
    {
      key: 'modify-password',
      label: intl.formatMessage({ id: 'users.form.updatepassword' }),
      children: <ModifyPasswordn />
    },
    {
      key: 'custom-ui',
      label: 'Custom UI',
      children: <CustomUI />
    }
  ];

  const handleChangeTab = useCallback((key: string) => {
    setActiveKey(key);
    setTabActive(tabsMap.userSettings, key);
  }, []);

  return (
    <Wrapper>
      <PageContainer
        ghost
        header={{
          title: 'User Settings',
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

Profile.displayName = 'Profile';

export default Profile;
