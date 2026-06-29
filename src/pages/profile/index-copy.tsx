import useTabActive from '@/hooks/use-tab-active';
import { useIntl, useModel } from '@umijs/max';
import { Tabs, TabsProps } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import PageBox from '../_components/page-box';
import Appearance from './components/appearance';
import ModifyPasswordn from './components/modify-password';

const Wrapper = styled.div`
  .ant-page-header-heading {
    padding-inline: 8px;
  }
`;

const Profile: React.FC = () => {
  const intl = useIntl();
  const { initialState, setInitialState } = useModel('@@initialState') || {};
  const { setTabActive, getTabActive, tabsMap } = useTabActive();
  const [activeKey, setActiveKey] = useState(
    initialState?.currentUser?.source === 'Local'
      ? 'modify-password'
      : 'appearance'
  );

  const items: TabsProps['items'] = useMemo(() => {
    if (initialState?.currentUser?.source !== 'Local') {
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
  }, [intl, initialState?.currentUser?.source]);

  const handleChangeTab = useCallback((key: string) => {
    setActiveKey(key);
    setTabActive(tabsMap.userSettings, key);
  }, []);

  return (
    <PageBox>
      <Tabs
        activeKey={activeKey}
        onChange={handleChangeTab}
        items={items}
        type="card"
      />
    </PageBox>
  );
};

Profile.displayName = 'Profile';

export default Profile;
