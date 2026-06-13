import { FileSkeletonRows } from '@/pages/llmodels/components/model-source/file-skeleton';
import { AutoTooltip, IconFont, TemplateCard } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Empty, Flex, Spin } from 'antd';
import _ from 'lodash';
import { Fragment } from 'react';
import styled from 'styled-components';
import { ListItem as TemplateItem } from '../../templates/config/types';

const GroupTitle = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: var(--ant-color-text-tertiary);
  margin-bottom: -8px;
`;

const TemplateContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--ant-color-text-secondary);

  .name {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
    color: var(--ant-color-text);
    font-weight: 500;
  }

  .info {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 8px;
    color: var(--ant-color-text-tertiary);
  }

  .value {
    color: var(--ant-color-text-secondary);
  }

  .icon {
    color: var(--ant-color-text-quaternary);
  }
`;

const TypeGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export interface TemplateGroup {
  key: string;
  label: React.ReactNode;
  items: TemplateItem[];
}

interface TemplateSelectorProps {
  value?: number;
  loading?: boolean;
  onChange?: (value: number, item: TemplateItem) => void;
  groups?: TemplateGroup[];
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  value,
  onChange,
  loading,
  groups = []
}) => {
  const intl = useIntl();

  const handleSelect = (item: TemplateItem) => {
    if (value === item.id) return;
    onChange?.(item.id, item);
  };

  if (loading) {
    return (
      <Spin spinning size="middle">
        <Flex orientation="vertical" gap={16} style={{ minHeight: 200 }}>
          {_.times(6, (index: number) => (
            <FileSkeletonRows key={index} counts={2} itemHeight={106} />
          ))}
        </Flex>
      </Spin>
    );
  }

  if (!groups.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const renderItem = (item: TemplateItem) => (
    <TemplateCard
      key={item.id}
      clickable
      ghost
      hoverable
      height={102}
      active={value === item.id}
      onClick={() => handleSelect(item)}
    >
      <TemplateContent>
        <div className="name">
          <AutoTooltip ghost minWidth={20}>
            {item.displayName || item.name || '-'}
          </AutoTooltip>
        </div>
        <div className="info">
          <span>
            <IconFont className="icon" type="icon-model" />{' '}
            {intl.formatMessage({
              id: 'gpuservice.instance.template.image'
            })}
            :
          </span>
          <AutoTooltip ghost minWidth={20}>
            <span className="value">{item.spec?.image || '-'}</span>
          </AutoTooltip>
        </div>
        <div className="info">
          <span>
            <IconFont className="icon" type="icon-storage-outlined" />{' '}
            {intl.formatMessage({
              id: 'gpuservice.instance.template.mount'
            })}
            :
          </span>
          <span className="value">{item.spec?.volumeMount || '-'}</span>
        </div>
      </TemplateContent>
    </TemplateCard>
  );

  // A single group renders flat — the header would only restate what
  // the whole list already is.
  const showGroupTitles = groups.length > 1;

  return (
    <Flex orientation="vertical" gap={16}>
      {groups.map((group) => (
        <Fragment key={group.key}>
          {showGroupTitles && <GroupTitle>{group.label}</GroupTitle>}
          {group.items.map(renderItem)}
        </Fragment>
      ))}
    </Flex>
  );
};

export default TemplateSelector;
