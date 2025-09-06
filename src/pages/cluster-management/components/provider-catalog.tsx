import Card from '@/components/templates/card';
import { useIntl } from '@umijs/max';
import React from 'react';
import styled from 'styled-components';
import { ProviderType } from '../config';

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 22px;
`;
interface ProviderCatalogProps {
  onSelect?: (provider: ProviderType) => void;
  currentProvider?: ProviderType;
  clickable?: boolean;
  dataList: {
    label: string;
    key: string;
    locale?: boolean;
    disabled?: boolean;
    icon: React.ReactNode;
    description?: string;
  }[];
}

const ProviderCatalog: React.FC<ProviderCatalogProps> = ({
  onSelect,
  dataList,
  clickable,
  currentProvider
}) => {
  const intl = useIntl();
  return (
    <Wrapper>
      {dataList?.map((action) => (
        <Card
          height="auto"
          key={action.key}
          onClick={() => onSelect?.(action.key as ProviderType)}
          active={currentProvider === action.key}
          disabled={action.disabled}
          clickable={clickable}
          header={
            action.locale
              ? intl.formatMessage({ id: action.label })
              : action.label
          }
          icon={action.icon}
        >
          {action.description || 'This is a description'}
        </Card>
      ))}
    </Wrapper>
  );
};

export default ProviderCatalog;
