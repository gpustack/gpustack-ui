import useUserSettings from '@/hooks/use-user-settings';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Select } from 'antd';
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
    max-width: 300px;
  }
  .theme-label {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: var(--font-weight-500);
  }
  .tips {
    color: var(--ant-color-text-secondary);
  }
`;

const Appearance: React.FC = () => {
  const { setTheme, userSettings } = useUserSettings();

  console.log('userSettings', userSettings);

  const intl = useIntl();

  const ThemeOptions = [
    {
      value: 'light',
      label: intl.formatMessage({ id: 'common.appearance.light' }),
      icon: <SunOutlined />
    },
    {
      value: 'realDark',
      label: intl.formatMessage({ id: 'common.appearance.dark' }),
      icon: <MoonOutlined />
    },
    {
      value: 'auto',
      label: intl.formatMessage({ id: 'common.appearance.system' }),
      icon: <SunOutlined />
    }
  ];

  const handleOnChange = (value: 'light' | 'realDark' | 'auto') => {
    setTheme(value);
  };

  const theme = useMemo(() => {
    return userSettings?.theme || 'auto';
  }, [userSettings?.theme]);

  return (
    <Wrapper>
      <div className="theme">
        <span className="theme-label">
          <span>{intl.formatMessage({ id: 'common.appearance.theme' })}</span>
        </span>
        <Select
          value={userSettings.mode}
          options={ThemeOptions}
          onChange={handleOnChange}
          style={{ width: 200 }}
        ></Select>
      </div>
    </Wrapper>
  );
};

Appearance.displayName = 'Appearance';

export default Appearance;
