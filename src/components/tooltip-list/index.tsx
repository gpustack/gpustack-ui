import { useIntl } from '@umijs/max';
import React from 'react';
import styled from 'styled-components';
import OverlayScroller from '../overlay-scroller';

const UL = styled.ul`
  list-style: none;
  padding-left: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  li {
    display: flex;
    flex-direction: column;
    .title {
      font-weight: 600;
      color: var(--ant-color-text-light-solid);
    }
    .content {
      color: var(--color-white-tertiary);
      display: inline-flex;
    }
  }
`;

interface TooltipListProps {
  list: { title: any; tips: string }[];
}

const TooltipList: React.FC<TooltipListProps> = (props) => {
  const intl = useIntl();
  const { list } = props;
  return (
    <OverlayScroller style={{ padding: 0 }}>
      <UL>
        {list.map((item, index: number) => {
          return (
            <li key={index}>
              <span className="title">
                {item.title?.locale
                  ? intl.formatMessage({ id: item.title?.text || '' })
                  : item.title}
                :
              </span>
              <span className="content">
                {intl.formatMessage({ id: item.tips })}
              </span>
            </li>
          );
        })}
      </UL>
    </OverlayScroller>
  );
};

export default TooltipList;
