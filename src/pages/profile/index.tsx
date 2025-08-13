import { userAtom } from '@/atoms/user';
import useTabActive from '@/hooks/use-tab-active';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { TabsProps } from 'antd';
import { useAtom } from 'jotai';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import Appearance from './components/appearance';
import ModifyPasswordn from './components/modify-password';

const Wrapper = styled.div`
  .ant-page-header-heading {
    padding-inline: 8px;
  }
`;

const Profile: React.FC = () => {
  const intl = useIntl();
  const [userInfo, setUserInfo] = useAtom(userAtom);
  const { setTabActive, getTabActive, tabsMap } = useTabActive();
  const [activeKey, setActiveKey] = useState(
    userInfo?.source === 'Local' ? 'modify-password' : 'appearance'
  );

  const items: TabsProps['items'] = useMemo(() => {
    if (userInfo?.source !== 'Local') {
      return [
        {
          key: 'appearance',
          label: intl.formatMessage({ id: 'common.appearance' }),
          children: <Appearance />
        }
      ];
    }
    return [
      {
        key: 'modify-password',
        label: intl.formatMessage({ id: 'users.form.updatepassword' }),
        children: <ModifyPasswordn />
      },
      {
        key: 'appearance',
        label: intl.formatMessage({ id: 'common.appearance' }),
        children: <Appearance />
      }
    ];
  }, [userInfo?.source]);

  const handleChangeTab = useCallback((key: string) => {
    setActiveKey(key);
    setTabActive(tabsMap.userSettings, key);
  }, []);

  return (
    <Wrapper>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'users.settings.title' }),
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
