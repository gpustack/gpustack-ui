import useUserSettings from '@/hooks/use-user-settings';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Switch } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
  .theme {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 220px;
  }
  .theme-label {
    font-size: 16px;
    font-weight: var(--font-weight-500);
  }
  .tips {
    color: var(--ant-color-text-secondary);
  }
`;

const ThemeOptions = [
  {
    key: 'realDark',
    label: 'common.appearance.dark',
    icon: <MoonOutlined />
  },
  {
    key: 'light',
    label: 'common.appearance.light',
    icon: <SunOutlined />
  }
];
const Appearance: React.FC = () => {
  const { setTheme, userSettings } = useUserSettings();

  const intl = useIntl();

  const handleOnChange = (checked: boolean) => {
    if (checked) {
      setTheme('realDark');
    } else {
      setTheme('light');
    }
  };

  const isDarkMode = useMemo(() => {
    const darkMode = userSettings?.theme === 'realDark';
    return darkMode;
  }, [userSettings?.theme]);

  return (
    <Wrapper>
      <div className="theme">
        <span className="theme-label">
          {intl.formatMessage({ id: 'common.appearance.darkmode' })}
        </span>
        <Switch checked={isDarkMode} onChange={handleOnChange} />
      </div>
      <div className="tips">
        {intl.formatMessage({ id: 'common.appearance.tips' })}
      </div>
    </Wrapper>
  );
};

Appearance.displayName = 'Appearance';

export default Appearance;
