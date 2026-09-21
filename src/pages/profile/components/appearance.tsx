import useUserSettings from '@/hooks/use-user-settings';
import langConfigMap from '@/locales/lang-config-map';
import { ensureLocaleMessages } from '@/locales/load-messages';
import { CheckCircleFilled } from '@ant-design/icons';
import { BaseSelect } from '@gpustack/core-ui';
import { getAllLocales, setLocale, useIntl } from '@umijs/max';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import _ from 'lodash';
import React from 'react';
import { SettingDivider, SettingRow } from './setting-row';
import ThemePreview, { PreviewMode } from './theme-preview';

const useStyles = createStyles(({ token, css }) => ({
  cards: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  `,
  card: css`
    padding: 8px;
    /* colorBorder, not colorBorderSecondary: at #f0f0f0 the unselected tiles'
       edge measured 1.12:1 — three choices where only the selected one looked
       like a control. */
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG + 2}px;
    background: ${token.colorBgContainer};
    cursor: pointer;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;

    &:hover {
      border-color: ${token.colorPrimaryBorderHover};
    }

    /* antd's own recipe, token for token — lineWidthFocus solid
       colorPrimaryBorder at 1px offset — so this tile focuses like every button
       and input on the page. The ring alone is not the signal: colorPrimaryBorder
       is 1.79:1 here, under 1.4.11's 3:1. What carries it is the border turning
       colorPrimary (3.91:1), exactly how antd's wrapped form controls do it.
       Keyboard focus had no visual at all before this. */
    &:focus-visible {
      border-color: ${token.colorPrimary};
      outline: ${token.lineWidthFocus}px solid ${token.colorPrimaryBorder};
      outline-offset: 1px;
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
    /* 500. This is the name of the choice — the text you actually read to pick
       — and at 400 it sank into being a caption under a picture. It was 400
       because at 600 the tile read as another heading; 500 does share size and
       weight with the Theme title above, but the tile's own border, its radio
       mark and the 180px between them settle the role long before typography
       has to. Which option is SELECTED is still carried by the border and the
       check icon, never by weight. */
    font-weight: var(--font-weight-medium);
    color: ${token.colorText};
  `,
  check: css`
    font-size: 18px;
    color: ${token.colorPrimary};
  `,
  /* This ring is the only thing saying "selectable, currently off", so WCAG
     1.4.11 wants 3:1 on it — colorBorder gave 1.41. colorTextTertiary (3.3) is
     the lightest token that clears it. 1px, not 1.5: every other line on the
     page is 1px, and a third line width needs a reason. */
  radio: css`
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid ${token.colorTextTertiary};
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

  // The ARIA radio pattern: arrows move within the group and select as they go,
  // Tab only enters and leaves it (that is what the roving tabIndex below is
  // for). Without this the three tiles were three separate tab stops and the
  // arrow keys did nothing.
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectTheme(themeOptions[index].value);
      return;
    }

    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    if (!step) {
      return;
    }

    e.preventDefault();
    const next = (index + step + themeOptions.length) % themeOptions.length;
    handleSelectTheme(themeOptions[next].value);
    (
      e.currentTarget.parentElement?.children[next] as HTMLElement | undefined
    )?.focus();
  };

  return (
    <>
      <SettingRow styles={{ body: { marginTop: 0 } }}>
        <div
          className={styles.cards}
          role="radiogroup"
          aria-label={intl.formatMessage({ id: 'common.appearance.theme' })}
        >
          {themeOptions.map((option, index) => {
            const active = userSettings.mode === option.value;
            return (
              <div
                key={option.value}
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className={classNames(styles.card, {
                  [styles.cardActive]: active
                })}
                onClick={() => handleSelectTheme(option.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
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

      <SettingDivider />

      <SettingRow
        title={intl.formatMessage({ id: 'common.settings.language' })}
        description={intl.formatMessage({
          id: 'common.settings.language.tips'
        })}
        extra={
          <BaseSelect
            value={intl.locale}
            options={languageOptions}
            onChange={async (value: string) => {
              // Same as the header's language menu: the messages have to be
              // registered before setLocale re-renders in place, and a pack that
              // failed to fetch leaves the current language alone.
              if (await ensureLocaleMessages(value)) {
                setLocale(value, false);
              }
            }}
            style={{ width: 200 }}
          />
        }
      />
    </>
  );
};

Appearance.displayName = 'Appearance';

export default Appearance;
