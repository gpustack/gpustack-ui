import { IconFont } from '@gpustack/core-ui';
import React from 'react';
import styled from 'styled-components';

export const GroupTitle = styled.div`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  margin-block: 16px 12px;
`;

export const GroupTips = styled.div`
  font-size: 12px;
  color: var(--ant-color-text-tertiary);
  margin-block: -6px 12px;
`;

export const EntryTitle = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ant-color-text-secondary);
`;

// a select entry led by the catalog's own icon, falling back to a glyph
// standing for the kind of thing it names
export const OptionWithIcon: React.FC<{
  icon?: string;
  fallbackGlyph: string;
  label: React.ReactNode;
}> = ({ icon, fallbackGlyph, label }) => (
  <span className="flex-center gap-8">
    {icon ? (
      <img src={icon} alt="" style={{ width: 16, height: 16 }} />
    ) : (
      <IconFont type={fallbackGlyph} />
    )}
    <span>{label}</span>
  </span>
);
