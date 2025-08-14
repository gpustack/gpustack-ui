import langConfigMap from '@/locales/lang-config-map';
import { GlobalOutlined } from '@ant-design/icons';
import { getAllLocales, setLocale } from '@umijs/max';
import { Dropdown } from 'antd';
import { createStyles } from 'antd-style';
import { get } from 'lodash';

const useStyles = createStyles(({ token, css }) => ({
  button: css`
    color: ${token.colorText};
    padding: 0 12px;
    cursor: pointer;
    .anticon {
      color: ${token.colorText};
    }
    &:hover {
      .anticon {
        color: ${token.colorTextTertiary};
      }
    }
  `
}));

const LangSelect = () => {
  const { styles } = useStyles();
  const allLocals = getAllLocales();
  const items = allLocals.map((key) => {
    return {
      key,
      label: (
        <span
          className="flex flex-center font-size-12"
          style={{ paddingInline: 8 }}
        >
          <span>{get(langConfigMap, [key, 'label'])}</span>
        </span>
      ),
      onClick: () => {
        setLocale(key, false);
      }
    };
  });

  return (
    <Dropdown menu={{ items }}>
      <span className={styles.button}>
        <GlobalOutlined />
      </span>
    </Dropdown>
  );
};

export default LangSelect;
