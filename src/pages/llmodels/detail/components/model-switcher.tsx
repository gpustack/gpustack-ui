import { AutoTooltip, BaseSelect } from '@gpustack/core-ui';
import { useIntl, useSearchParams } from '@umijs/max';
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
  tenant
}: {
  id: number;
  name: string;
  tenant: string;
}) => {
  const intl = useIntl();
  const [, setSearchParams] = useSearchParams();
  const { dataList, loading, fetchData } = useQueryModelList();
  const options = [
    { value: id, label: name },
    ...dataList.filter((item) => item.id !== id)
  ];

  return (
    <BaseSelect
      size="small"
      variant="borderless"
      aria-label={intl.formatMessage({ id: 'modelMonitoring.deployment' })}
      value={id}
      options={options}
      loading={loading}
      showSearch={{ optionFilterProp: 'label' }}
      popupMatchSelectWidth={false}
      labelRender={renderModelLabel}
      onOpenChange={(open) => {
        if (open && !loading && tenantKey() === tenant) {
          void fetchData({ page: -1 }).catch(() => {});
        }
      }}
      onChange={(value: number) => {
        if (value !== id && tenantKey() === tenant) {
          setSearchParams({ id: String(value) }, { replace: true });
        }
      }}
    />
  );
};

export default ModelSwitcher;
