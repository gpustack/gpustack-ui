import IconFont from '@/components/icon-font';
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
    padding: 10px 16px;
  }
  .template-card-inner {
    justify-content: center;
  }
`;

const Container = styled.div`
  display: flex;
  margin: 0 auto;
  flex-direction: column;
  gap: 24px;
`;

const Title = styled.span`
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 16px;
  .icon {
    color: var(--ant-color-text-secondary);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background-color: var(--ant-color-fill-tertiary);
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  .title {
    font-weight: 500;
  }
  .description {
    font-size: 13px;
    font-weight: 400;
    color: var(--ant-color-text-tertiary);
  }
`;

interface ProviderCatalogProps {
  onSelect?: (provider: string, item: any) => void;
  groupIcons?: Record<string, string>;
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
  groupIcons,
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

  const renderTitle = (item: any) => {
    if (item.hiddenTitle) {
      return <>{item.extra && <span className="extra">{item.extra}</span>}</>;
    }
    return (
      <Header>
        <span className="title">
          {item.locale ? intl.formatMessage({ id: item.label }) : item.label}
        </span>
        {item.description && (
          <span className="description">
            {intl.formatMessage({ id: item.description })}
          </span>
        )}
        {item.extra && <span className="extra">{item.extra}</span>}
      </Header>
    );
  };

  return (
    <Container>
      {Object.entries(groupList).map(([groupName, items]) => (
        <div key={groupName}>
          {groupName !== 'default' && (
            <Title>
              {groupIcons && groupIcons[groupName] && (
                <span className="icon">
                  <IconFont type={groupIcons[groupName]} />
                </span>
              )}
              <span>{intl.formatMessage({ id: groupName })}</span>
            </Title>
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
                header={renderTitle(action)}
                icon={action.icon}
              ></Card>
            ))}
          </Wrapper>
        </div>
      ))}
    </Container>
  );
};

export default ProviderCatalog;
