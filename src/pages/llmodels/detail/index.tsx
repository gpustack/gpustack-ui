import { HeaderLeft, PageBreadcrumb } from '@gpustack/core-ui';
import { useIntl, useSearchParams } from '@umijs/max';
import { App, Button, Flex, Result, Tabs } from 'antd';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties
} from 'react';
import breadcrumbStyles from '../../_components/page-breadcrumb/index.module.less';
import DetailHeader from './components/detail-header';
import DetailPending from './components/detail-pending';
import { DeviceDrawer } from './components/hardware-content';
import { RequestNotice } from './components/metric-state';
import ModelSwitcher from './components/model-switcher';
import { DetailContext } from './config/context';
import type {
  DetailTab,
  MonitoringScope,
  ResourceDevice
} from './config/types';
import ConfigurationTab from './configuration-tab';
import GPUResourcesTab from './gpu-resources-tab';
import useDeploymentMetadata from './hooks/use-deployment-metadata';
import {
  tenantKey,
  useMonitoringData,
  useMonitoringTenant
} from './hooks/use-monitoring-data';
import InstancesTab from './instances-tab';
import MonitoringTab, { type MonitoringTabHandle } from './monitoring-tab';
import OverviewTab from './overview-tab';

type ModelLabel = { id: number; name: string };

const DetailPage = ({
  id,
  tenant,
  tab,
  onTabChange,
  onModelLabel,
  preparing,
  switching,
  onPrepared,
  onPrepareFailed
}: {
  id: number;
  tenant: string;
  tab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onModelLabel: (label: ModelLabel | null) => void;
  preparing: boolean;
  switching: boolean;
  onPrepared: (id: number, name?: string) => void;
  onPrepareFailed: (id: number) => void;
}) => {
  const intl = useIntl();
  const data = useMonitoringData(id, tenant, { initialTab: tab, preparing });
  const setTab = (next: DetailTab) => {
    if (switching) return;
    data.changeTabScope(next);
    onTabChange(next);
  };
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
  const modelName = model?.name;
  const metadata = useDeploymentMetadata(model);
  const pending = !model && (data.model.loading || !data.model.key);
  const initialDataPending =
    (metadata.loading && !metadata.data) ||
    [data.instances, data.runtime, data.resources].some(
      ({ data, key, loading }) => !data && (!key || loading)
    );
  const ready = !!model && !initialDataPending;
  const preparationFailed = !model && !pending;
  useLayoutEffect(() => {
    if (!preparing) return;
    if (ready) onPrepared(id, modelName);
    if (preparationFailed) onPrepareFailed(id);
  }, [
    id,
    modelName,
    onPrepared,
    onPrepareFailed,
    preparationFailed,
    preparing,
    ready
  ]);

  useEffect(() => {
    if (!preparing) onModelLabel(modelName ? { id, name: modelName } : null);
  }, [id, modelName, onModelLabel, preparing]);

  if (preparing) return null;
  if (tenantKey() !== tenant) return <DetailPending />;
  const items = [
    {
      key: 'overview',
      label: t('performance'),
      children: <OverviewTab />
    },
    {
      key: 'monitoring',
      label: t('monitoring'),
      children: <MonitoringTab ref={monitorRef} />
    },
    { key: 'instances', label: t('instances'), children: <InstancesTab /> },
    { key: 'gpu', label: t('gpuResources'), children: <GPUResourcesTab /> },
    {
      key: 'configuration',
      label: t('configuration'),
      children: <ConfigurationTab />
    }
  ];

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
      <Flex vertical gap={16}>
        {!pending && <RequestNotice state={data.model} />}
        {pending || model ? (
          <>
            {model ? (
              <DetailHeader
                key={`${tenant}:${model.id}:${model.cluster_id}:${model.owner_principal_id ?? ''}`}
                model={model}
                tenant={tenant}
                deploymentMetadata={metadata.data}
                resources={data.resources.data}
                onResources={() => setTab('gpu')}
              />
            ) : (
              <div aria-hidden style={{ minBlockSize: 56 }} />
            )}
            <Tabs
              type="card"
              size="middle"
              style={
                {
                  '--metric-chart-card-border-color': 'var(--ant-color-border)',
                  '--metric-chart-heading-font-weight':
                    'var(--font-weight-medium)'
                } as CSSProperties
              }
              activeKey={tab}
              onChange={(value) => setTab(value as DetailTab)}
              items={
                model
                  ? items
                  : items.map((item) => ({
                      ...item,
                      children: <DetailPending />
                    }))
              }
            />
          </>
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
        )}
        <DeviceDrawer
          deviceId={model && !switching ? deviceId : null}
          onClose={() => setDeviceId(null)}
        />
      </Flex>
    </DetailContext.Provider>
  );
};

const DetailShell = ({
  id,
  tenant,
  replaceId
}: {
  id: number;
  tenant: string;
  replaceId: (id: number) => void;
}) => {
  const intl = useIntl();
  const { message } = App.useApp();
  const [tab, setTab] = useState<DetailTab>('overview');
  const [modelLabel, setModelLabel] = useState<ModelLabel | null>(null);
  const [selection, setSelection] = useState<{ from: number; to: number }>();
  if (selection && selection.from !== id) setSelection(undefined);
  const pendingId = selection?.from === id ? selection.to : undefined;
  const switching = pendingId !== undefined;
  const handlePrepared = useCallback(
    (preparedId: number, name?: string) => {
      if (preparedId !== pendingId || tenantKey() !== tenant) return;
      setModelLabel(name ? { id: preparedId, name } : null);
      replaceId(preparedId);
    },
    [pendingId, replaceId, tenant]
  );
  const handlePrepareFailed = useCallback(
    (failedId: number) => {
      if (failedId !== pendingId || tenantKey() !== tenant) return;
      setSelection(undefined);
      message.error(
        intl.formatMessage({ id: 'modelMonitoring.switchDeploymentFailed' })
      );
    },
    [intl, message, pendingId, tenant]
  );
  if (tenantKey() !== tenant) return <DetailPending />;
  return (
    <>
      <HeaderLeft>
        <Flex align="center">
          <div className={breadcrumbStyles.breadcrumb}>
            <PageBreadcrumb
              items={[
                {
                  title: (
                    <a href="#/models/deployments">
                      {intl.formatMessage({
                        id: 'modelMonitoring.deployments'
                      })}
                    </a>
                  )
                },
                {
                  title: (
                    <ModelSwitcher
                      id={id}
                      name={modelLabel?.id === id ? modelLabel.name : undefined}
                      tenant={tenant}
                      switching={switching}
                      onSelect={(nextId) =>
                        setSelection(
                          nextId === id ? undefined : { from: id, to: nextId }
                        )
                      }
                    />
                  )
                }
              ]}
            />
          </div>
        </Flex>
      </HeaderLeft>
      {(pendingId === undefined ? [id] : [id, pendingId]).map((modelId) => {
        const preparing = modelId !== id;
        const retaining = !preparing && switching;
        return (
          <div
            key={modelId}
            hidden={preparing}
            aria-busy={retaining || undefined}
            ref={(element) => {
              element?.toggleAttribute('inert', retaining);
            }}
          >
            <DetailPage
              id={modelId}
              tenant={tenant}
              tab={tab}
              onTabChange={setTab}
              onModelLabel={setModelLabel}
              preparing={preparing}
              switching={retaining}
              onPrepared={handlePrepared}
              onPrepareFailed={handlePrepareFailed}
            />
          </div>
        );
      })}
    </>
  );
};

const ModelDetail = () => {
  const [params, setSearchParams] = useSearchParams();
  const tenant = useMonitoringTenant();
  const id = Number(params.get('id'));
  const intl = useIntl();
  return Number.isSafeInteger(id) && id > 0 ? (
    <DetailShell
      key={tenant}
      id={id}
      tenant={tenant}
      replaceId={(nextId) =>
        setSearchParams({ id: String(nextId) }, { replace: true })
      }
    />
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
