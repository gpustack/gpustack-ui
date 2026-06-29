import useUserSettings from '@/hooks/use-user-settings';
import langConfigMap from '@/locales/lang-config-map';
import { CheckCircleFilled } from '@ant-design/icons';
import { BaseSelect } from '@gpustack/core-ui';
import { getAllLocales, setLocale, useIntl } from '@umijs/max';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import _ from 'lodash';
import React from 'react';
import { SettingRow, SettingsGroup } from './settings-group';
import ThemePreview, { PreviewMode } from './theme-preview';

const useStyles = createStyles(({ token, css }) => ({
  cards: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  `,
  card: css`
    padding: 8px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG + 2}px;
    background: ${token.colorBgContainer};
    cursor: pointer;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;

    &:hover {
      border-color: ${token.colorPrimaryBorderHover};
    }
  `,
  cardActive: css`
    border-color: ${token.colorPrimary};
    box-shadow: 0 0 0 1px ${token.colorPrimary};
  `,
  meta: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 8px 6px;
  `,
  label: css`
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: ${token.colorText};
  `,
  check: css`
    font-size: 18px;
    color: ${token.colorPrimary};
  `,
  radio: css`
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px solid ${token.colorBorder};
  `
}));

const Appearance: React.FC = () => {
  const { setTheme, userSettings } = useUserSettings();
  const intl = useIntl();
  const { styles } = useStyles();
  const allLocals = getAllLocales();

  const themeOptions: { value: PreviewMode; label: string }[] = [
    {
      value: 'light',
      label: intl.formatMessage({ id: 'common.appearance.lightmode' })
    },
    {
      value: 'realDark',
      label: intl.formatMessage({ id: 'common.appearance.darkmode' })
    },
    {
      value: 'auto',
      label: intl.formatMessage({ id: 'common.appearance.system' })
    }
  ];

  const languageOptions = allLocals.map((locale) => ({
    value: locale,
    label: _.get(langConfigMap, [locale, 'label'])
  }));

  const handleSelectTheme = (value: PreviewMode) => {
    setTheme(value);
  };

  return (
    <SettingsGroup>
      <SettingRow
        title={intl.formatMessage({ id: 'common.appearance.theme' })}
        description={intl.formatMessage({ id: 'common.appearance.tips' })}
      >
        <div className={styles.cards}>
          {themeOptions.map((option) => {
            const active = userSettings.mode === option.value;
            return (
              <div
                key={option.value}
                role="radio"
                aria-checked={active}
                tabIndex={0}
                className={classNames(styles.card, {
                  [styles.cardActive]: active
                })}
                onClick={() => handleSelectTheme(option.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectTheme(option.value);
                  }
                }}
              >
                <ThemePreview mode={option.value} />
                <div className={styles.meta}>
                  <span className={styles.label}>{option.label}</span>
                  {active ? (
                    <CheckCircleFilled className={styles.check} />
                  ) : (
                    <span className={styles.radio} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SettingRow>

      <SettingRow
        title={intl.formatMessage({ id: 'common.settings.language' })}
        description={intl.formatMessage({
          id: 'common.settings.language.tips'
        })}
        extra={
          <BaseSelect
            value={intl.locale}
            options={languageOptions}
            onChange={(value: string) => {
              setLocale(value, false);
            }}
            style={{ width: 200 }}
          />
        }
      />
    </SettingsGroup>
  );
};

Appearance.displayName = 'Appearance';

export default Appearance;
