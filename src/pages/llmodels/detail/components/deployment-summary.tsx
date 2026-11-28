import type { StatusType } from '@/config/types';
import {
  CardWrapper,
  icons,
  StatusDot,
  StatusTag,
  ThemeTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Col, Descriptions, Flex, Row } from 'antd';
import dayjs from 'dayjs';
import {
  TargetStatus,
  TargetStatusValueMap
} from '../../../model-routes/config';
import { isRoleDraining, isRoleWaiting } from '../../components/pd/role-status';
import { isRestartInFlight, modelReplicaCounts } from '../../config';
import type { ListItem } from '../../config/types';
import type { getDeploymentStatus } from '../../utils/deployment-status';
import type { ModelResourceMetrics } from '../config/types';
import type { DeploymentMetadata } from '../services/deployment-metadata';
import type { HeaderMetadata } from '../services/header-metadata';
import type { ResourceSnapshot } from '../services/scoped-resource';
import DeploymentCacheSummary from './deployment-cache-summary';

interface DeploymentSummaryProps {
  model: ListItem;
  deploymentStatus: ReturnType<typeof getDeploymentStatus>;
  headerMetadata: ResourceSnapshot<HeaderMetadata>;
  deploymentMetadata: DeploymentMetadata | null;
  resources: ModelResourceMetrics | null;
  onResources: () => void;
}

const roleNames: Record<string, string> = {
  prefill: 'Prefill',
  decode: 'Decode',
  router: 'Router'
};

const statusDotStyles = {
  root: { lineHeight: 'var(--ant-line-height)' },
  text: { whiteSpace: 'normal', overflowWrap: 'anywhere' }
} as const;

export default function DeploymentSummary({
  model,
  deploymentStatus,
  headerMetadata,
  deploymentMetadata,
  resources,
  onResources
}: DeploymentSummaryProps) {
  const intl = useIntl();
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const replicas = modelReplicaCounts(model);
  const restarting = isRestartInFlight(model.restarting_since);
  const readyInstances = model.roles?.length ? (
    <Flex gap="small" justify="flex-end" wrap>
      {model.roles.map((role) => {
        const counts = model.role_status?.[role.name];
        let status: StatusType = 'inactive';
        if (!deploymentStatus.inactive && counts) {
          const item = { ...counts, name: role.name };
          status = isRoleWaiting(item)
            ? restarting
              ? 'transitioning'
              : deploymentStatus.status === 'success'
                ? 'warning'
                : deploymentStatus.status
            : isRoleDraining(item)
              ? 'warning'
              : 'success';
        }
        return (
          <StatusDot
            key={role.name}
            statusValue={{
              status,
              text: `${roleNames[role.name] || role.name} ${counts?.ready ?? '—'} / ${counts?.desired ?? role.replicas}`
            }}
            styles={statusDotStyles}
          />
        );
      })}
    </Flex>
  ) : (
    <StatusTag
      statusValue={{
        status: deploymentStatus.status,
        text: `${replicas.ready} / ${replicas.total}`
      }}
    />
  );
  const routeName = headerMetadata.data?.target?.route_name;
  const routeStatus = routeName
    ? TargetStatusValueMap.Active
    : TargetStatusValueMap.Unavailable;
  const groups = [
    [
      {
        key: 'backend',
        label: t('backend'),
        children:
          [model.backend, model.backend_version].filter(Boolean).join(' ') ||
          '—'
      },
      {
        key: 'route',
        label: t('modelRoute'),
        children:
          routeName || (headerMetadata.key && !headerMetadata.loading) ? (
            <StatusDot
              statusValue={{
                status: TargetStatus[routeStatus],
                text: routeName || t('metadataUnavailable')
              }}
              styles={statusDotStyles}
            />
          ) : (
            '—'
          )
      },
      {
        key: 'access',
        label: t('access'),
        children: model.access_policy ? (
          <ThemeTag
            icon={<span aria-hidden>{icons.Permission}</span>}
            styles={{
              icon: {
                color: 'var(--ant-color-text-secondary)',
                flexShrink: 0
              },
              content: { minWidth: 0 }
            }}
            style={{
              gap: 'var(--ant-margin-xxs)',
              height: 'auto',
              maxWidth: '100%',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              textAlign: 'end'
            }}
          >
            {model.access_policy}
          </ThemeTag>
        ) : (
          '—'
        )
      }
    ],
    [
      {
        key: 'cluster',
        label: t('deploymentCluster'),
        children:
          headerMetadata.data?.clusterName ||
          intl.formatMessage(
            { id: 'modelMonitoring.clusterFallback' },
            { id: model.cluster_id }
          )
      },
      {
        key: 'replicas',
        label: t('readyInstances'),
        children: readyInstances
      },
      {
        key: 'resources',
        label: t('gpuResources'),
        children: resources ? (
          <Button
            type="link"
            size="small"
            onClick={onResources}
            style={{
              paddingInline: 0,
              height: 'auto',
              whiteSpace: 'normal',
              textAlign: 'end'
            }}
          >
            {`${resources.allocated_gpu_count ?? '—'} GPU · ${resources.allocated_worker_count ?? '—'} Worker`}
          </Button>
        ) : (
          '—'
        )
      }
    ],
    [
      {
        key: 'source',
        label: t('modelSource'),
        children:
          model.huggingface_repo_id ||
          model.model_scope_model_id ||
          model.local_path ||
          model.ollama_library_model_name ||
          model.source ||
          '—'
      },
      {
        key: 'cache',
        label: t('cacheConfiguration'),
        children: (
          <DeploymentCacheSummary
            model={model}
            metadata={deploymentMetadata}
            tagged
          />
        )
      },
      {
        key: 'created',
        label: t('created'),
        children: model.created_at
          ? dayjs(model.created_at).format('YYYY-MM-DD HH:mm:ss')
          : '—'
      }
    ]
  ];
  return (
    <Row gutter={[16, 16]}>
      {groups.map((items) => (
        <Col key={items[0].key} xs={24} lg={8}>
          <CardWrapper style={{ paddingBlock: 16, height: '100%' }}>
            <Descriptions
              size="small"
              column={1}
              colon={false}
              styles={{
                label: {
                  alignItems: 'center',
                  minHeight: 28,
                  maxWidth: '45%',
                  overflowWrap: 'anywhere'
                },
                content: {
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  minWidth: 0,
                  overflowWrap: 'anywhere',
                  textAlign: 'end'
                }
              }}
              items={items}
            />
          </CardWrapper>
        </Col>
      ))}
    </Row>
  );
}
