import useUserSettings from '@/hooks/use-user-settings';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Radio } from 'antd';
import React from 'react';

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

  const handleOnChange = (e: any) => {
    setTheme(e.target.value);
  };
  return (
    <Radio.Group
      onChange={handleOnChange}
      style={{ marginTop: 16 }}
      value={userSettings.theme}
    >
      {ThemeOptions.map((item) => (
        <Radio key={item.key} value={item.key}>
          {intl.formatMessage({ id: item.label })}
        </Radio>
      ))}
    </Radio.Group>
  );
};

Appearance.displayName = 'Appearance';

export default Appearance;
