import { RequestNotice } from '@/pages/_components/monitoring';
import PageBreadcrumb from '@/pages/_components/page-breadcrumb';
import {
  tenantKey,
  useMonitoringTenant
} from '@/pages/llmodels/detail/hooks/use-monitoring-data';
import { HeaderLeft } from '@gpustack/core-ui';
import { useLocation, useSearchParams } from '@umijs/max';
import { Button, Flex, Result, Skeleton, Tabs } from 'antd';
import { useState } from 'react';
import styles from './components/detail.module.less';
import ResourceHeader from './components/resource-header';
import { ResourceContext } from './config/context';
import type { ResourceTab, ResourceTarget, TimeScope } from './config/types';
import ConfigurationTab from './configuration-tab';
import {
  isAuthorizationError,
  useResourceDetail
} from './hooks/use-resource-detail';
import { useResourceIntl } from './hooks/use-resource-intl';
import InstancesTab from './instances-tab';
import MonitoringTab from './monitoring-tab';
import OverviewTab from './overview-tab';
import { timeScopeFromParams } from './utils/navigation';

const DetailPage = ({
  target,
  tenant,
  initialScope,
  initialTab
}: {
  target: ResourceTarget;
  tenant: string;
  initialScope: TimeScope;
  initialTab: ResourceTab;
}) => {
  const data = useResourceDetail(target, tenant, initialScope);
  const [tab, setTab] = useState(initialTab);
  const t = useResourceIntl();
  if (tenant !== tenantKey()) return <Skeleton active />;
  const revoked = [
    data.detail.error,
    data.metrics.error,
    data.capabilities.error
  ].some(isAuthorizationError);
  const current = revoked ? null : data.detail.data;
  return (
    <ResourceContext.Provider value={{ ...data, tab, setTab }}>
      <HeaderLeft>
        <div className={styles.breadcrumb}>
          <PageBreadcrumb
            items={[
              {
                title: (
                  <a
                    href={`#/resources/${target.kind === 'gpu' ? 'gpus' : 'workers'}`}
                  >
                    {t(target.kind === 'gpu' ? 'gpus' : 'workers')}
                  </a>
                )
              },
              {
                title: current
                  ? current.selected_device_id
                    ? `${current.worker.name} / GPU ${current.devices.find((d) => d.id === current.selected_device_id)?.index ?? ''}`
                    : current.worker.name
                  : t('details')
              }
            ]}
          />
        </div>
      </HeaderLeft>
      <Flex vertical gap={20} className={styles.page}>
        <RequestNotice state={data.detail} />
        {!current ? (
          data.detail.loading && !revoked ? (
            <Skeleton active />
          ) : (
            <Result
              status="404"
              title={t('unavailable')}
              extra={
                <Button onClick={() => void data.refresh()}>
                  {t('refresh')}
                </Button>
              }
            />
          )
        ) : (
          <>
            <ResourceHeader
              key={JSON.stringify([
                current.worker.id,
                current.worker.owner_principal_id,
                current.worker.cluster_id
              ])}
            />
            <Tabs
              activeKey={tab}
              onChange={(key) => setTab(key as ResourceTab)}
              items={[
                {
                  key: 'overview',
                  label: t('overview'),
                  children: <OverviewTab />
                },
                {
                  key: 'monitoring',
                  label: t('monitoring'),
                  children: <MonitoringTab />
                },
                {
                  key: 'instances',
                  label: t('modelsAndInstances'),
                  children: <InstancesTab />
                },
                {
                  key: 'configuration',
                  label: t(
                    target.kind === 'gpu' ? 'hardware' : 'configuration'
                  ),
                  children: <ConfigurationTab />
                }
              ]}
            />
          </>
        )}
      </Flex>
    </ResourceContext.Provider>
  );
};
export default function ResourceDetailPage() {
  const [params] = useSearchParams(),
    location = useLocation(),
    tenant = useMonitoringTenant();
  const kind = location.pathname.includes('/gpus/') ? 'gpu' : 'worker';
  const target: ResourceTarget = {
    kind,
    id: params.get('worker_id') || params.get('id') || '',
    deviceId: kind === 'gpu' ? params.get('device_id') || undefined : undefined
  };
  const initialScope = timeScopeFromParams(params),
    requestedTab = params.get('tab');
  const initialTab: ResourceTab = [
    'overview',
    'monitoring',
    'instances',
    'configuration'
  ].includes(requestedTab || '')
    ? (requestedTab as ResourceTab)
    : 'overview';
  const t = useResourceIntl();
  const valid =
    target.id.length > 0 &&
    target.id.length < 512 &&
    ((kind === 'gpu' && !target.deviceId) || /^[1-9][0-9]*$/.test(target.id));
  return valid ? (
    <DetailPage
      key={JSON.stringify([
        location.key,
        tenant,
        target,
        initialScope,
        initialTab
      ])}
      target={target}
      tenant={tenant}
      initialScope={initialScope}
      initialTab={initialTab}
    />
  ) : (
    <Result status="404" title={t('unavailable')} />
  );
}
