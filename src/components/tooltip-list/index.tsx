import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import React from 'react';

interface TooltipListProps {
  list: { title: any; tips: string }[];
}

const TooltipList: React.FC<TooltipListProps> = (props) => {
  const intl = useIntl();
  const { list } = props;
  return (
    <ul className="tips-desc-list">
      {list.map((item, index: number) => {
        return (
          <li className="m-b-8" key={index}>
            <Typography.Title
              level={5}
              style={{
                color: 'var(--color-white-1)',
                marginRight: 10,
                marginBottom: 0
              }}
            >
              {item.title?.locale
                ? intl.formatMessage({ id: item.title?.text || '' })
                : item.title}
              :
            </Typography.Title>
            <Typography.Text
              style={{
                color: 'var(--color-white-1)',
                display: 'inline-flex',
                lineHeight: 1.5
              }}
            >
              {intl.formatMessage({ id: item.tips })}
            </Typography.Text>
          </li>
        );
      })}
    </ul>
  );
};

export default TooltipList;
