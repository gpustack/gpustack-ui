import BaseSelect from '@/components/seal-form/base/select';
import useUserSettings from '@/hooks/use-user-settings';
import langConfigMap from '@/locales/lang-config-map';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { getAllLocales, setLocale, useIntl } from '@umijs/max';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
`;

const SettingsItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 300px;
  .label {
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: var(--font-weight-500);
  }
`;

const Appearance: React.FC = () => {
  const { setTheme, userSettings } = useUserSettings();

  const intl = useIntl();
  const allLocals = getAllLocales();

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

  const languageOptions = allLocals.map((locale) => ({
    value: locale,
    label: _.get(langConfigMap, [locale, 'label'])
  }));

  return (
    <Wrapper>
      <SettingsItem>
        <span className="label">
          <span>{intl.formatMessage({ id: 'common.appearance.theme' })}</span>
        </span>
        <BaseSelect
          defaultValue={'light'}
          value={userSettings.mode}
          options={ThemeOptions}
          onChange={handleOnChange}
          style={{ width: 200 }}
        ></BaseSelect>
      </SettingsItem>
      <SettingsItem>
        <span className="label">
          <span>{intl.formatMessage({ id: 'common.settings.language' })}</span>
        </span>
        <BaseSelect
          value={intl.locale}
          options={languageOptions}
          onChange={(value) => {
            setLocale(value, false);
          }}
          style={{ width: 200 }}
        ></BaseSelect>
      </SettingsItem>
    </Wrapper>
  );
};

Appearance.displayName = 'Appearance';

export default Appearance;
