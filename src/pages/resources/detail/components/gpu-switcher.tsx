import type { ResourceDevice } from '@/pages/llmodels/detail/config/types';
import { gpuDeviceLabel } from '@/pages/llmodels/detail/utils/resources';
import { AutoTooltip, BaseSelect } from '@gpustack/core-ui';
import { history } from '@umijs/max';
import type { ReactNode } from 'react';
import type { ResourceTab, TimeScope } from '../config/types';
import { useResourceIntl } from '../hooks/use-resource-intl';
import { resourceHref } from '../utils/navigation';

const renderGpuLabel = ({ label }: { label?: ReactNode }) => (
  <AutoTooltip ghost showTitle style={{ width: 'fit-content' }}>
    {label}
  </AutoTooltip>
);

export default function GpuSwitcher({
  workerId,
  device,
  devices,
  scope,
  tab
}: {
  workerId: number;
  device: ResourceDevice;
  devices: ResourceDevice[];
  scope: TimeScope;
  tab: ResourceTab;
}) {
  const t = useResourceIntl();
  const options = devices.map((item) => ({
    value: item.id,
    label: `${gpuDeviceLabel(item, t('chip'))} · ${item.name}`
  }));

  return (
    <BaseSelect
      size="small"
      variant="borderless"
      aria-label={t('switchGPU')}
      value={device.id}
      options={options}
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
      labelRender={renderGpuLabel}
      onSelect={(id: string) => {
        if (id === device.id) return;
        history.push(
          resourceHref(
            { kind: 'gpu', id: String(workerId), deviceId: id },
            scope,
            tab
          ).slice(1)
        );
      }}
    />
  );
}
