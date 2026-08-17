import langConfigMap from '@/locales/lang-config-map';
import { ensureLocaleMessages } from '@/locales/load-messages';
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
      onClick: async () => {
        // setLocale(..., false) re-renders in place rather than reloading, so the
        // messages have to be registered before the switch, not after it. Hold the
        // switch back if the pack could not be fetched — the user then stays on a
        // language they can read instead of landing on English under a new label.
        if (await ensureLocaleMessages(key)) {
          setLocale(key, false);
        }
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
