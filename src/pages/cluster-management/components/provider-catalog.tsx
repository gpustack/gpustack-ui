import Card from '@/components/templates/card';
import { useIntl } from '@umijs/max';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { ProviderType } from '../config';

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 22px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Title = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  font-size: 18px;
  margin-block: 16px 24px;
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
    group?: string;
  }[];
}

const ProviderCatalog: React.FC<ProviderCatalogProps> = ({
  onSelect,
  dataList,
  clickable,
  currentProvider
}) => {
  const intl = useIntl();

  const groupList = useMemo(() => {
    if (!dataList) return {};
    return dataList?.reduce(
      (acc, item) => {
        (acc[item.group || 'default'] ??= []).push(item);
        return acc;
      },
      {} as Record<string, typeof dataList>
    );
  }, [dataList]);

  return (
    <Container>
      {Object.entries(groupList).map(([groupName, items]) => (
        <div key={groupName}>
          {groupName !== 'default' && <Title>{groupName}</Title>}
          <Wrapper>
            {items?.map((action) => (
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
        </div>
      ))}
    </Container>
  );
};

export default ProviderCatalog;
