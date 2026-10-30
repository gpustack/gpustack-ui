import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { BaseSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Input } from 'antd';
import type { ChangeEvent } from 'react';

interface WorkerFiltersProps {
  label?: string[];
  showCluster: boolean;
  clusterOptions: Global.BaseOption<number>[];
  onNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLabelChange: (value: string[]) => void;
  onClusterChange: (value: number) => void;
  onRefresh: () => void;
}

export default function WorkerFilters({
  label,
  showCluster,
  clusterOptions,
  onNameChange,
  onLabelChange,
  onClusterChange,
  onRefresh
}: WorkerFiltersProps) {
  const intl = useIntl();
  const namePlaceholder = intl.formatMessage({ id: 'common.filter.name' });
  const labelPlaceholder = intl.formatMessage({ id: 'resources.filter.label' });
  const refreshLabel = intl.formatMessage({ id: 'common.button.refresh' });

  return (
    <Flex gap="small" wrap align="center">
      <Input
        allowClear
        prefix={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          />
        }
        placeholder={namePlaceholder}
        aria-label={namePlaceholder}
        onChange={onNameChange}
        style={{ width: 180 }}
      />
      <BaseSelect
        mode="tags"
        allowClear
        notFoundContent={null}
        maxTagCount="responsive"
        value={label || []}
        suffixIcon={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          />
        }
        placeholder={labelPlaceholder}
        aria-label={labelPlaceholder}
        onChange={onLabelChange}
        style={{ width: 320, maxWidth: '100%' }}
      />
      {showCluster ? (
        <BaseSelect
          allowClear
          placeholder={intl.formatMessage({ id: 'clusters.filterBy.cluster' })}
          options={clusterOptions}
          onChange={onClusterChange}
          style={{ width: 180 }}
        />
      ) : null}
      <Button
        type="text"
        icon={<SyncOutlined />}
        aria-label={refreshLabel}
        title={refreshLabel}
        onClick={onRefresh}
        style={{ color: 'var(--ant-color-text-tertiary)' }}
      />
    </Flex>
  );
}
