import useUserSettings from '@/hooks/use-user-settings';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Dropdown } from 'antd';
import { createStyles } from 'antd-style';
import IconFont from '../icon-font';

const useStyles = createStyles(({ token, css }) => ({
  inner: css`
    display: flex;
    align-items: center;
    cursor: pointer;
    color: ${token.colorText};
    font-size: var(--font-size-base);
    padding: 0 8px;
    &:hover {
      color: ${token.colorTextTertiary};
    }
    .anticon {
      font-size: 16px;
    }
    .icon-auto {
      font-size: 20px;
    }
  `
}));

const ThemeDropActions = () => {
  const { setTheme, userSettings } = useUserSettings();
  const { styles } = useStyles();
  const intl = useIntl();

  const ThemeOptions = [
    {
      key: 'light',
      label: intl.formatMessage({ id: 'common.appearance.light' }),
      icon: <SunOutlined />
    },
    {
      key: 'realDark',
      label: intl.formatMessage({ id: 'common.appearance.dark' }),
      icon: <MoonOutlined />
    },
    {
      key: 'auto',
      label: intl.formatMessage({ id: 'common.appearance.system' }),
      icon: <IconFont type="icon-dark_theme" className="icon-auto"></IconFont>
    }
  ];

  const handleOnChange = (item: any) => {
    const value = item.key as 'light' | 'realDark' | 'auto';
    setTheme(value);
  };

  return (
    <Dropdown menu={{ items: ThemeOptions, onClick: handleOnChange }}>
      <div className={styles.inner}>
        {userSettings.mode === 'auto' ? (
          <IconFont type="icon-dark_theme" className="icon-auto"></IconFont>
        ) : userSettings.mode === 'realDark' ? (
          <MoonOutlined />
        ) : (
          <SunOutlined />
        )}
      </div>
    </Dropdown>
  );
};

export default ThemeDropActions;
