import { AutoTooltip, BaseSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import type { ReactNode } from 'react';
import useQueryModelList from '../../services/use-query-model-list';
import { tenantKey } from '../hooks/use-monitoring-data';

const renderModelLabel = ({ label }: { label?: ReactNode }) => (
  <AutoTooltip ghost showTitle style={{ width: 'fit-content' }}>
    {label}
  </AutoTooltip>
);

const ModelSwitcher = ({
  id,
  name,
  tenant,
  switching,
  onSelect
}: {
  id: number;
  name?: string;
  tenant: string;
  switching: boolean;
  onSelect: (id: number) => void;
}) => {
  const intl = useIntl();
  const { dataList, loading, fetchData } = useQueryModelList();
  const options = [
    {
      value: id,
      label: name || dataList.find((item) => item.id === id)?.label || `#${id}`
    },
    ...dataList.filter((item) => item.id !== id)
  ];

  return (
    <BaseSelect
      size="small"
      variant="borderless"
      aria-label={intl.formatMessage({ id: 'modelMonitoring.deployment' })}
      value={id}
      options={options}
      loading={loading || switching}
      showSearch={{ optionFilterProp: 'label' }}
      popupMatchSelectWidth={false}
      popupAlign={{ overflow: { shiftX: true, adjustY: true } }}
      style={{ width: 'fit-content', maxWidth: '100%' }}
      styles={{
        popup: {
          root: {
            maxWidth: 'calc(100vw - 2 * var(--ant-padding))'
          }
        }
      }}
      labelRender={renderModelLabel}
      onOpenChange={(open) => {
        if (open && !loading && tenantKey() === tenant) {
          void fetchData({ page: -1 }).catch(() => {});
        }
      }}
      onSelect={(value: number) => {
        if ((value !== id || switching) && tenantKey() === tenant) {
          onSelect(value);
        }
      }}
    />
  );
};

export default ModelSwitcher;
