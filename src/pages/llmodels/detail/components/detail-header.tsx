import type { StatusType } from '@/config/types';
import { ApiOutlined, ExperimentOutlined } from '@ant-design/icons';
import { StatusTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Space, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import ModelTag from '../../../_components/model-tag';
import useOpenPlayground from '../../../model-routes/hooks/use-open-playground';
import APIAccessInfoModal from '../../components/api-access-info';
import {
  isModelServable,
  isPDModel,
  modelReplicaCounts,
  ModelStateLabelMap,
  ModelStateMap
} from '../../config';
import type { ListItem } from '../../config/types';
import useViewAPIInfo from '../../hooks/use-view-api-info';
import type { ModelResourceMetrics } from '../config/types';
import useDetailHeaderMetadata from '../hooks/use-detail-header-metadata';

interface DetailHeaderProps {
  model: ListItem;
  tenant: string;
  resources: ModelResourceMetrics | null;
  onResources: () => void;
}

const DetailHeader = ({
  model,
  tenant,
  resources,
  onResources
}: DetailHeaderProps) => {
  const intl = useIntl();
  const { metadata, reload, isCurrent } = useDetailHeaderMetadata(
    model,
    tenant
  );
  const { handleOpenPlayGround, generateModelName } = useOpenPlayground();
  const { apiAccessInfo, openViewAPIInfo, closeViewAPIInfo } = useViewAPIInfo();
  const latestModel = useRef(model);
  latestModel.current = model;
  const [pending, setPending] = useState<'api' | 'playground' | null>(null);
  const openedRoute = useRef<string | null>(null);
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const canAccess =
    isCurrent() && isModelServable(model) && !!metadata.data?.target;
  const target = metadata.data?.target;
  const routeKey = target ? `${target.route_id}:${target.route_name}` : null;
  useEffect(() => {
    // A revoked route or a newly unservable model cannot retain an open API
    // dialog. The keyed header also disposes its state on tenant/model changes.
    if (!canAccess || openedRoute.current !== routeKey) {
      closeViewAPIInfo();
      openedRoute.current = null;
    }
  }, [canAccess, routeKey]);
  const openServingAction = async (action: 'api' | 'playground') => {
    if (!isCurrent() || !isModelServable(latestModel.current)) return;
    setPending(action);
    try {
      const verified = await reload();
      const current = latestModel.current;
      if (!isCurrent() || !isModelServable(current) || !verified?.target)
        return;
      const route = {
        name: verified.target.route_name,
        categories: current.categories || [],
        owner_principal_id: current.owner_principal_id
      };
      if (action === 'playground') {
        handleOpenPlayGround(route);
      } else {
        openedRoute.current = `${verified.target.route_id}:${verified.target.route_name}`;
        openViewAPIInfo({ ...current, name: generateModelName(route) });
      }
    } finally {
      if (isCurrent()) setPending(null);
    }
  };
  const replicas = modelReplicaCounts(model);
  const replicaShape = isPDModel(model)
    ? model
        .roles!.map((role) => {
          const label =
            (
              {
                prefill: 'Prefill',
                decode: 'Decode',
                router: 'Router'
              } as Record<string, string>
            )[role.name] || role.name;
          const desired =
            model.role_status?.[role.name]?.desired ?? role.replicas;
          return `${label} ${desired}`;
        })
        .join(' / ')
    : intl.formatMessage(
        { id: 'modelMonitoring.instanceCount' },
        { count: replicas.total }
      );
  return (
    <>
      <Flex align="flex-start" justify="space-between" wrap gap={16}>
        <Flex vertical gap={8} style={{ minWidth: 0, flex: '1 1 420px' }}>
          <Flex align="center" wrap gap={8}>
            <Typography.Title level={3} style={{ margin: 0, fontSize: 20 }}>
              {model.name}
            </Typography.Title>
            <ModelTag categoryKey={model.categories?.[0] || ''} />
            <StatusTag
              statusValue={{
                status:
                  (ModelStateMap as Record<string, StatusType>)[
                    model.state || ''
                  ] || 'inactive',
                text: intl.formatMessage({
                  id:
                    (ModelStateLabelMap as Record<string, string>)[
                      model.state || ''
                    ] || 'modelMonitoring.unknown'
                }),
                message: model.state_message || undefined
              }}
            />
          </Flex>
          <Flex align="center" gap={8} wrap>
            <Typography.Text type="secondary">
              {[
                [model.backend, model.backend_version]
                  .filter(Boolean)
                  .join(' '),
                metadata.data?.clusterName ||
                  intl.formatMessage(
                    { id: 'modelMonitoring.clusterFallback' },
                    { id: model.cluster_id }
                  ),
                replicaShape
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography.Text>
            <Typography.Text type="secondary" aria-hidden>
              ·
            </Typography.Text>
            <Button
              type="link"
              size="small"
              onClick={onResources}
              style={{ paddingInline: 0, height: 'auto' }}
            >
              {resources
                ? `${resources.allocated_gpu_count} GPU · ${resources.allocated_worker_count} Worker`
                : t('gpuResources')}
            </Button>
          </Flex>
        </Flex>
        {canAccess && (
          <Space
            wrap
            size={8}
            style={{ marginInlineStart: 'auto', flexShrink: 0 }}
          >
            <Button
              icon={<ApiOutlined />}
              onClick={() => void openServingAction('api')}
              loading={pending === 'api'}
              disabled={!!pending || metadata.loading}
            >
              {intl.formatMessage({
                id: 'models.table.button.apiAccessInfo'
              })}
            </Button>
            <Button
              type="primary"
              icon={<ExperimentOutlined />}
              onClick={() => void openServingAction('playground')}
              loading={pending === 'playground'}
              disabled={!!pending || metadata.loading}
            >
              {intl.formatMessage({ id: 'models.openinplayground' })}
            </Button>
          </Space>
        )}
      </Flex>
      {apiAccessInfo.show && canAccess && target && (
        <APIAccessInfoModal
          key={target.route_id}
          open
          data={apiAccessInfo.data}
          onClose={closeViewAPIInfo}
        />
      )}
    </>
  );
};

export default DetailHeader;
