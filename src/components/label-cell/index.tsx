import AutoTooltip from '@/components/auto-tooltip';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';

const LabelsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

interface LabelCellProps {
  labels: Record<string, any>;
}

const LabelsCell: React.FC<LabelCellProps> = ({ labels }) => (
  <LabelsWrapper>
    {_.map(labels, (value: string, key: string) => (
      <AutoTooltip
        key={key}
        className="m-r-0"
        maxWidth={155}
        style={{ paddingInline: 8, borderRadius: 12 }}
      >
        <span>{key}</span>
        <span>:{value}</span>
      </AutoTooltip>
    ))}
  </LabelsWrapper>
);

export default LabelsCell;
