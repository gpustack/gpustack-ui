import Card from '@/components/templates/card';
import { useIntl } from '@umijs/max';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { ProviderType } from '../config';

const Wrapper = styled.div<{ $cols?: number }>`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(${(props) => props.$cols || 3}, 1fr);
  gap: 16px;
  .template-card-wrapper {
    padding: 10px;
  }
  .template-card-inner {
    justify-content: center;
  }
`;

const Container = styled.div`
  display: flex;
  width: 800px;
  margin: 0 auto;
  flex-direction: column;
  gap: 16px;
`;

const Title = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  font-size: 16px;
  margin-block: 20px 16px;
`;

interface ProviderCatalogProps {
  onSelect?: (provider: string, item: any) => void;
  cols?: number;
  current?: ProviderType | string;
  clickable?: boolean;
  height: string | number;
  dataList: {
    label: string;
    key: string;
    locale?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    description?: string;
    group?: string;
  }[];
}

const ProviderCatalog: React.FC<ProviderCatalogProps> = ({
  onSelect,
  cols = 3,
  dataList,
  clickable,
  height,
  current
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
          {groupName !== 'default' && (
            <Title>{intl.formatMessage({ id: groupName })}</Title>
          )}
          <Wrapper $cols={cols}>
            {items?.map((action) => (
              <Card
                height={height}
                key={action.key}
                onClick={() => onSelect?.(action.key as string, action)}
                active={current === action.key}
                disabled={action.disabled}
                clickable={clickable}
                header={
                  action.locale
                    ? intl.formatMessage({ id: action.label })
                    : action.label
                }
                icon={action.icon}
              >
                {action.description &&
                  intl.formatMessage({ id: action.description })}
              </Card>
            ))}
          </Wrapper>
        </div>
      ))}
    </Container>
  );
};

export default ProviderCatalog;
