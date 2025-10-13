import AutoTooltip from '@/components/auto-tooltip';
import { OverlayScroller } from '@/components/overlay-scroller';
import { Tag } from 'antd';
import React from 'react';
import styled from 'styled-components';

const TagInner = styled(Tag)`
  border-radius: 12px;
  margin: 0;
`;

const Content = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
`;

interface SelectedProps {
  maxHeight?: number;
  selectedList: { key: string; title: string }[];
  onUnselect: (
    key: string,
    newSelectedKeys: { key: string; title: string }[]
  ) => void;
}

const SelectedList: React.FC<SelectedProps> = ({
  maxHeight,
  selectedList,
  onUnselect
}) => {
  const handleOnUnselect = (key: string) => {
    const newSelectedKeys = selectedList.filter((item) => item.key !== key);
    onUnselect(key, newSelectedKeys);
  };

  return (
    <OverlayScroller maxHeight={maxHeight}>
      <Content>
        {selectedList.map((item) => (
          <AutoTooltip
            title={item.title}
            key={item.key}
            maxWidth={200}
            onClose={(e) => {
              e.preventDefault();
              handleOnUnselect(item.key);
            }}
            closable
          >
            {item.title}
          </AutoTooltip>
        ))}
      </Content>
    </OverlayScroller>
  );
};

export default SelectedList;
