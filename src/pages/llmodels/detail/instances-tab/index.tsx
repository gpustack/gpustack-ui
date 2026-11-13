import { DownloadOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  GrafanaIcon,
  IconFont,
  Table as SealTable,
  StatusDot
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Typography } from 'antd';
import useGrafanaLink from '../../../resources/hooks/use-grafana-link';
import ViewLogsModal from '../../components/view-logs-modal';
import {
  InstanceStatusMap,
  InstanceStatusMapValue,
  status as instanceStatus
} from '../../config';
import useDownloadInstanceLogs from '../../hooks/use-download-instance-logs';
import useViewInstanceLogs from '../../hooks/use-view-instance-logs';
import { RequestNotice } from '../components/metric-state';
import ScopeToolbar from '../components/scope-toolbar';
import { useDetail } from '../config/context';
import { gpuDeviceLabel, instanceGPUState } from '../utils/resources';
const InstancesTab = () => {
  const intl = useIntl();
  const { model, instances, resources, scope, inspectDevice, setTab } =
    useDetail();
  const { openViewLogsModal, closeViewLogsModal, openViewLogsModalStatus } =
    useViewInstanceLogs();
  const { downloadLogs } = useDownloadInstanceLogs();
  const { goToGrafana, showMonitoring } = useGrafanaLink({ type: 'instance' });
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const visible = (instances.data || []).filter(
    (instance) =>
      (!scope.instanceIds.length || scope.instanceIds.includes(instance.id)) &&
      (scope.role === 'all' || instance.role === scope.role)
  );
  const columns = [
    {
      dataIndex: 'name',
      title: t('instance'),
      minWidth: 160,
      span: 3,
      render: (name: string) => <AutoTooltip ghost>{name || '—'}</AutoTooltip>
    },
    {
      dataIndex: 'state',
      title: t('status'),
      width: 136,
      render: (value: string, instance: any) => (
        <Flex vertical gap={4}>
          <StatusDot
            statusValue={{
              status:
                instanceStatus[
                  value === InstanceStatusMap.Downloading &&
                  instance.download_progress === 100
                    ? InstanceStatusMap.Running
                    : value
                ] || instanceStatus[InstanceStatusMap.Unknown],
              text:
                InstanceStatusMapValue[value] ||
                InstanceStatusMapValue[InstanceStatusMap.Unknown]
            }}
          />
          {instance.draining_since && (
            <Typography.Text type="secondary">{t('draining')}</Typography.Text>
          )}
        </Flex>
      )
    },
    {
      dataIndex: 'role',
      title: t('role'),
      width: 88,
      render: (value: string) => value || t('inference')
    },
    {
      dataIndex: 'worker_name',
      title: 'Worker',
      minWidth: 140,
      span: 2,
      render: (name: string) => <AutoTooltip ghost>{name || '—'}</AutoTooltip>
    },
    {
      dataIndex: 'gpu_indexes',
      title: t('device'),
      minWidth: 208,
      span: 4,
      render: (_: unknown, instance: any) => (
        <Flex gap={6} wrap style={{ minWidth: 0, width: '100%' }}>
          {(resources.data?.devices || [])
            .filter((device) => device.model_instance_ids.includes(instance.id))
            .map((device) => (
              <Flex
                key={device.id}
                vertical
                gap={4}
                style={{ minWidth: 0, maxWidth: '100%' }}
              >
                <Button
                  size="small"
                  style={{ minWidth: 0, maxWidth: '100%' }}
                  onClick={() => inspectDevice(device)}
                >
                  <Typography.Text
                    ellipsis={{ tooltip: true }}
                    style={{ maxWidth: '100%' }}
                  >
                    {device.worker_name} / {gpuDeviceLabel(device, t('chip'))}
                  </Typography.Text>
                </Button>
                <Typography.Text
                  type="secondary"
                  ellipsis={{ tooltip: true }}
                  style={{ fontSize: 12, maxWidth: '100%' }}
                >
                  {device.name}
                </Typography.Text>
              </Flex>
            ))}
          {!(resources.data?.devices || []).some((device) =>
            device.model_instance_ids.includes(instance.id)
          ) && (
            <Typography.Text type="secondary">
              {t(
                instanceGPUState(instance, resources.data?.devices || []) ===
                  'unallocated'
                  ? 'noGPUAllocated'
                  : 'resourceVisibilityUnavailable'
              )}
            </Typography.Text>
          )}
        </Flex>
      )
    },
    {
      dataIndex: 'backend',
      title: t('backend'),
      width: 136,
      render: (_: unknown, instance: any) => {
        const role = model.data?.roles?.find(
          (item) => item.name === instance.role
        );
        // A Router executable can have a different version from the engine
        // inside the same image. Only its explicit role declaration is known.
        if (instance.role === 'router')
          return [role?.backend || 'Router', role?.backend_version]
            .filter(Boolean)
            .join(' ');
        return (
          [
            instance.backend || role?.backend || model.data?.backend,
            instance.backend_version ||
              role?.backend_version ||
              model.data?.backend_version
          ]
            .filter(Boolean)
            .join(' ') || '—'
        );
      }
    },
    {
      dataIndex: 'restart_count',
      title: t('restartCount'),
      width: 116,
      render: (value: number | null) => value ?? '—'
    },
    {
      dataIndex: 'id',
      title: t('actions'),
      width: 136,
      render: (_: unknown, instance: any) => {
        const canDownload = [
          InstanceStatusMap.Initializing,
          InstanceStatusMap.Running,
          InstanceStatusMap.Error,
          InstanceStatusMap.Starting,
          InstanceStatusMap.Downloading
        ].includes(instance.state);
        const actions = [
          {
            key: 'logs',
            label: 'modelMonitoring.logs',
            icon: <IconFont type="icon-logs" />
          },
          ...(canDownload
            ? [
                {
                  key: 'download',
                  label: 'common.button.downloadLog',
                  icon: <DownloadOutlined />
                }
              ]
            : []),
          ...(showMonitoring
            ? [
                {
                  key: 'grafana',
                  label: 'Grafana',
                  locale: false,
                  icon: <GrafanaIcon />
                }
              ]
            : [])
        ];
        return (
          <DropdownButtons
            items={actions}
            onSelect={(action) => {
              if (action === 'logs') openViewLogsModal(instance);
              else if (action === 'download') void downloadLogs(instance);
              else if (action === 'grafana') goToGrafana(instance);
            }}
          />
        );
      }
    }
  ];
  return (
    <Flex vertical gap={16} style={{ minWidth: 0, maxWidth: '100%' }}>
      <ScopeToolbar />
      <RequestNotice state={instances} />
      <RequestNotice state={resources} />
      <Flex justify="flex-end" align="center" gap={12} wrap>
        <Button type="link" onClick={() => setTab('gpu')}>
          {t('viewResources')} →
        </Button>
      </Flex>
      <SealTable
        rowKey="id"
        columns={columns}
        dataSource={visible}
        loading={instances.loading}
        scroll={{ x: true }}
      />
      <ViewLogsModal
        status={openViewLogsModalStatus.currentData.status}
        url={openViewLogsModalStatus.currentData.url}
        tail={openViewLogsModalStatus.currentData.tail}
        id={openViewLogsModalStatus.currentData.id}
        modelId={openViewLogsModalStatus.currentData.modelId}
        open={openViewLogsModalStatus.open}
        onCancel={closeViewLogsModal}
      />
    </Flex>
  );
};
export default InstancesTab;
