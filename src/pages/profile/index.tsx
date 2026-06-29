import { useIntl, useModel } from '@umijs/max';
import { createStyles } from 'antd-style';
import React from 'react';
import PageBox from '../_components/page-box';
import Appearance from './components/appearance';
import Security from './components/security';
import SettingsSection from './components/settings-section';

const useStyles = createStyles(({ css }) => ({
  wrapper: css`
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    padding: 8px 0 40px;
  `
}));

const Profile: React.FC = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { initialState } = useModel('@@initialState') || {};
  const isLocalUser = initialState?.currentUser?.source === 'Local';

  return (
    <PageBox>
      <div className={styles.wrapper}>
        <SettingsSection
          title={intl.formatMessage({ id: 'common.appearance' })}
          description={intl.formatMessage({
            id: 'common.appearance.description'
          })}
        >
          <Appearance />
        </SettingsSection>

        {isLocalUser && (
          <SettingsSection
            title={intl.formatMessage({ id: 'common.security' })}
            description={intl.formatMessage({
              id: 'common.security.description'
            })}
          >
            <Security />
          </SettingsSection>
        )}
      </div>
    </PageBox>
  );
};

Profile.displayName = 'Profile';

export default Profile;
