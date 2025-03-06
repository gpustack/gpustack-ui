import React from 'react';

import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import { Divider } from 'antd';

interface InfoColumnProps {
  fieldList: { label: string; key: string }[];
  data: Record<string, any>;
}
const InfoColumn: React.FC<InfoColumnProps> = (props) => {
  const { data, fieldList } = props;

  const intl = useIntl();

  return (
    <span className="flex">
      {fieldList.map((item, index) => {
        return (
          <>
            <span className="flex-column flex-center">
              <span> {intl.formatMessage({ id: item.label })}</span>
              <span> {convertFileSize(data[item.key], 0)}</span>
            </span>
            {index < fieldList.length - 1 ? (
              <Divider
                type="vertical"
                style={{
                  height: 30,
                  marginInline: 16,
                  borderColor: 'var(--color-white-light-2)',
                  alignSelf: 'center'
                }}
              ></Divider>
            ) : null}
          </>
        );
      })}
    </span>
  );
};

export default InfoColumn;
