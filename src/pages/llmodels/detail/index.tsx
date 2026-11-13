import { HeaderLeft } from '@gpustack/core-ui';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Flex, Result, Skeleton, Tabs } from 'antd';
import { useEffect, useRef, useState } from 'react';
import PageBreadcrumb from '../../_components/page-breadcrumb';
import DetailHeader from './components/detail-header';
import { DeviceDrawer } from './components/hardware-content';
import { RequestNotice } from './components/metric-state';
import { DetailContext } from './config/context';
import type {
  DetailTab,
  MonitoringScope,
  ResourceDevice
} from './config/types';
import ConfigurationTab from './configuration-tab';
import GPUResourcesTab from './gpu-resources-tab';
import {
  tenantKey,
  useMonitoringData,
  useMonitoringTenant
} from './hooks/use-monitoring-data';
import InstancesTab from './instances-tab';
import MonitoringTab, { type MonitoringTabHandle } from './monitoring-tab';
import OverviewTab from './overview-tab';

const DetailPage = ({ id, tenant }: { id: number; tenant: string }) => {
  const intl = useIntl();
  const data = useMonitoringData(id, tenant);
  const [tab, setTab] = useState<DetailTab>('overview');
  const monitorRef = useRef<MonitoringTabHandle>(null);
  const openMonitoringSection = (section: string) => {
    setTab('monitoring');
    requestAnimationFrame(() => monitorRef.current?.openSection(section));
  };
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const inspectDevice = (next: ResourceDevice) => {
    setDeviceId(next.id);
    data.changeScope({ deviceId: next.id });
  };
  const changeScope = (patch: Partial<MonitoringScope>) => {
    if (Object.keys(patch).some((key) => key !== 'deviceId')) setDeviceId(null);
    data.changeScope(patch);
  };
  // Visibility controls the rendered drawer directly. This cleanup also
  // forgets the selection, so a later authorization change cannot reopen it.
  useEffect(() => {
    if (
      deviceId &&
      !data.resources.loading &&
      !data.resources.data?.devices.some((item) => item.id === deviceId)
    )
      setDeviceId(null);
  }, [deviceId, data.resources.data, data.resources.loading]);
  const model = data.model.data;
  if (tenantKey() !== tenant) return <Skeleton active />;
  return (
    <DetailContext.Provider
      value={{
        ...data,
        changeScope,
        tab,
        setTab,
        inspectDevice,
        openMonitoringSection
      }}
    >
      <HeaderLeft>
        <PageBreadcrumb
          items={[
            { title: <a href="#/models/deployments">{t('deployments')}</a> },
            { title: model?.name || `#${id}` }
          ]}
        />
      </HeaderLeft>
      <Flex vertical gap={16}>
        <RequestNotice state={data.model} />
        {!model ? (
          data.model.loading ? (
            <Skeleton active />
          ) : (
            <Result
              status={
                (data.model.error as any)?.response?.status === 403
                  ? '403'
                  : '404'
              }
              title={t('deploymentUnavailable')}
              extra={<Button onClick={data.refresh}>{t('refresh')}</Button>}
            />
          )
        ) : (
          <>
            <DetailHeader
              key={`${tenant}:${model.id}:${model.cluster_id}:${model.owner_principal_id ?? ''}`}
              model={model}
              tenant={tenant}
              resources={data.resources.data}
              onResources={() => setTab('gpu')}
            />
            <Tabs
              activeKey={tab}
              onChange={(value) => setTab(value as DetailTab)}
              items={[
                {
                  key: 'overview',
                  label: t('overview'),
                  children: <OverviewTab />
                },
                {
                  key: 'monitoring',
                  label: t('monitoring'),
                  children: <MonitoringTab ref={monitorRef} />
                },
                {
                  key: 'instances',
                  label: t('instances'),
                  children: <InstancesTab />
                },
                {
                  key: 'gpu',
                  label: t('gpuResources'),
                  children: <GPUResourcesTab />
                },
                {
                  key: 'configuration',
                  label: t('configuration'),
                  children: <ConfigurationTab />
                }
              ]}
            />
          </>
        )}
        <DeviceDrawer
          deviceId={model ? deviceId : null}
          onClose={() => setDeviceId(null)}
        />
      </Flex>
    </DetailContext.Provider>
  );
};
const ModelDetail = () => {
  const [params] = useSearchParams();
  const tenant = useMonitoringTenant();
  const id = Number(params.get('id'));
  const intl = useIntl();
  return Number.isSafeInteger(id) && id > 0 ? (
    <DetailPage key={`${tenant}:${id}`} id={id} tenant={tenant} />
  ) : (
    <Result
      status="404"
      title={intl.formatMessage({
        id: 'modelMonitoring.deploymentUnavailable'
      })}
    />
  );
};
export default ModelDetail;
