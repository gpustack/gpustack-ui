import React from 'react';

import { useIntl } from '@umijs/max';
import { Divider } from 'antd';

interface InfoColumnProps {
  fieldList: {
    label: string;
    key: string;
    locale?: boolean;
    render?: (val: any, data: any) => any;
  }[];
  style?: React.CSSProperties;
  data: Record<string, any>;
}
const InfoColumn: React.FC<InfoColumnProps> = (props) => {
  const { data, fieldList, style } = props;

  const intl = useIntl();

  return (
    <span className="flex" style={style}>
      {fieldList.map((item, index) => {
        return (
          <span key={item.key || index} className="flex-center">
            <span className="flex-column flex-center">
              <span>
                {' '}
                {item.locale
                  ? intl.formatMessage({ id: item.label })
                  : item.label}
              </span>
              <span style={{ color: 'var(--color-white-quaternary)' }}>
                {' '}
                {item.render?.(data[item.key], data) ?? data[item.key]}
              </span>
            </span>
            {index < fieldList.length - 1 ? (
              <Divider
                orientation="vertical"
                style={{
                  height: 30,
                  marginInline: 12,
                  borderColor: 'var(--color-white-light-2)',
                  alignSelf: 'center'
                }}
              ></Divider>
            ) : null}
          </span>
        );
      })}
    </span>
  );
};

export default InfoColumn;
