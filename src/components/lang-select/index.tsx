import langConfigMap from '@/locales/lang-config-map';
import { GlobalOutlined } from '@ant-design/icons';
import { getAllLocales, setLocale } from '@umijs/max';
import { Dropdown } from 'antd';
import { get } from 'lodash';

const LangSelect = () => {
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
      <span style={{ padding: '0 12px', cursor: 'pointer' }}>
        <GlobalOutlined />
      </span>
    </Dropdown>
  );
};

export default LangSelect;
