import useUserSettings from '@/hooks/use-user-settings';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ token, css }) => ({
  wrapper: css`
    display: inline-flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    color: ${token.colorText};
    font-size: var(--font-size-base);
    padding: 0 8px;
    gap: 8px;
    &:hover {
      color: ${token.colorTextTertiary};
    }
    .anticon {
      font-size: 16px;
    }
  `
}));

const ThemeToggle: React.FC = () => {
  const { setTheme, userSettings } = useUserSettings();
  const { styles } = useStyles();

  const handleChangeTheme = () => {
    const currentTheme =
      userSettings.theme === 'realDark' ? 'light' : 'realDark';
    setTheme(currentTheme);
  };

  return (
    <div className={styles.wrapper} onClick={handleChangeTheme}>
      {userSettings.theme === 'realDark' ? <MoonOutlined /> : <SunOutlined />}
    </div>
  );
};

export default ThemeToggle;
