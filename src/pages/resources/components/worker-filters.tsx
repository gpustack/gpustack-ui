import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { BaseSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useDebounceFn } from 'ahooks';
import { Button, Flex, Input } from 'antd';
import type { ChangeEvent } from 'react';
import { useState } from 'react';

interface WorkerFiltersProps {
  label?: string;
  showCluster: boolean;
  clusterOptions: Global.BaseOption<number>[];
  onNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLabelChange: (value: string) => void;
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
  const [invalidLabel, setInvalidLabel] = useState(false);
  const { run: changeLabel, flush: searchLabel } = useDebounceFn(
    (value: string) => {
      const valid = value === '' || value.indexOf('=') > 0;
      setInvalidLabel(!valid);
      if (valid) onLabelChange(value);
    },
    {
      wait: 350
    }
  );
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
      <Input
        allowClear
        defaultValue={label}
        prefix={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          />
        }
        placeholder={labelPlaceholder}
        aria-label={labelPlaceholder}
        title={intl.formatMessage({ id: 'resources.filter.label.help' })}
        status={invalidLabel ? 'error' : undefined}
        aria-invalid={invalidLabel || undefined}
        onChange={(event) => {
          setInvalidLabel(false);
          changeLabel(event.target.value);
        }}
        onPressEnter={() => searchLabel()}
        style={{ width: 220 }}
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
