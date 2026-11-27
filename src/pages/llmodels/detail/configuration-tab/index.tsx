import {
  CardWrapper,
  CopyButton,
  icons,
  SectionTitle,
  ThemeTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Col, Descriptions, Flex, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import DeploymentCacheSummary from '../components/deployment-cache-summary';
import { useDetail } from '../config/context';
import useDeploymentMetadata from '../hooks/use-deployment-metadata';
import ReadOnlyRevisions from './components/read-only-revisions';

const descriptionStyles = {
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
} as const;

const ParameterBlock = ({
  text,
  ariaLabel
}: {
  text: string;
  ariaLabel?: string;
}) => (
  <Flex
    align="flex-start"
    justify="space-between"
    gap={8}
    style={{
      padding: 'var(--ant-padding-xs) var(--ant-padding-sm)',
      background: 'var(--ant-color-fill-quaternary)',
      border: '1px solid var(--ant-color-border-secondary)',
      borderRadius: 'var(--ant-border-radius)'
    }}
  >
    <Typography.Paragraph
      aria-label={ariaLabel}
      style={{
        margin: 0,
        minWidth: 0,
        flex: 1,
        fontFamily: 'var(--ant-font-family-code)',
        fontSize: 'var(--font-size-code)',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere'
      }}
    >
      {text || '—'}
    </Typography.Paragraph>
    {text && <CopyButton text={text} size="small" />}
  </Flex>
);

const ConfigurationTab = () => {
  const intl = useIntl();
  const { model } = useDetail();
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const data = model.data;
  const metadata = useDeploymentMetadata(data);
  if (!data) return null;
  const configuration = data as unknown as Record<string, any>;
  const enabled = (value: boolean | null | undefined) =>
    value == null
      ? '—'
      : intl.formatMessage({
          id: value ? 'common.button.enabled' : 'common.button.disabled'
        });
  const backend =
    [data.backend, data.backend_version].filter(Boolean).join(' ') || '—';
  const groups = [
    {
      key: 'modelAndBackend',
      items: [
        { key: 'name', label: t('deployment'), children: data.name },
        { key: 'source', label: t('source'), children: data.source },
        {
          key: 'repository',
          label: t('repository'),
          children:
            data.huggingface_repo_id ||
            data.model_scope_model_id ||
            data.local_path ||
            data.ollama_library_model_name ||
            '—'
        },
        { key: 'backend', label: t('backend'), children: backend },
        {
          key: 'context',
          label: t('contextLength'),
          children: configuration.context_length ?? '—'
        }
      ]
    },
    {
      key: 'deploymentScheduling',
      items: [
        {
          key: 'cluster',
          label: t('cluster'),
          children:
            metadata.data?.clusterName ||
            intl.formatMessage(
              { id: 'modelMonitoring.clusterFallback' },
              { id: data.cluster_id }
            )
        },
        {
          key: 'mode',
          label: t('deploymentMode'),
          children: data.disaggregation?.mode || t('standardReplicas')
        },
        {
          key: 'replicas',
          label: t('desiredInstances'),
          children: data.roles?.length
            ? data.roles
                .map((role) => `${role.name}: ${role.replicas}`)
                .join(' · ')
            : data.replicas
        },
        {
          key: 'gpus',
          label: t('gpuPerInstance'),
          children: data.gpu_selector?.gpus_per_replica ?? '—'
        },
        {
          key: 'placement',
          label: t('placementStrategy'),
          children: configuration.placement_strategy || '—'
        },
        {
          key: 'restart',
          label: t('autoRestart'),
          children: enabled(configuration.restart_on_error)
        },
        {
          key: 'access',
          label: t('access'),
          children: data.access_policy ? (
            <ThemeTag
              icon={<span aria-hidden>{icons.Permission}</span>}
              styles={{
                icon: {
                  color: 'var(--ant-color-text-secondary)',
                  flexShrink: 0
                }
              }}
              style={{ gap: 'var(--ant-margin-xxs)' }}
            >
              {data.access_policy}
            </ThemeTag>
          ) : (
            '—'
          )
        }
      ]
    },
    {
      key: 'cacheEngineParameters',
      items: [
        {
          key: 'cache',
          label: t('cacheConfiguration'),
          children: (
            <DeploymentCacheSummary
              model={data}
              metadata={metadata.data}
              tagged
            />
          )
        }
      ]
    },
    {
      key: 'revisionCapabilities',
      items: [
        {
          key: 'updated',
          label: intl.formatMessage({ id: 'common.table.updateTime' }),
          children: data.updated_at
            ? dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss')
            : '—'
        }
      ]
    }
  ];
  return (
    <Flex vertical gap={16}>
      <Row gutter={[16, 16]}>
        {groups.map((group) => (
          <Col xs={24} xl={12} key={group.key}>
            <CardWrapper style={{ paddingBlock: 16, height: '100%' }}>
              <SectionTitle>{t(group.key)}</SectionTitle>
              <Descriptions
                size="small"
                column={1}
                colon={false}
                styles={descriptionStyles}
                items={group.items}
              />
              {group.key === 'revisionCapabilities' && (
                <ReadOnlyRevisions model={data} />
              )}
              {group.key === 'cacheEngineParameters' && (
                <Flex vertical gap={12} style={{ marginTop: 12 }}>
                  <ParameterBlock
                    ariaLabel={t('engineParameters')}
                    text={(configuration.backend_parameters || []).join('\n')}
                  />
                  {(data.roles || []).map((role) => (
                    <Flex key={role.name} vertical gap={6}>
                      <Typography.Text strong>
                        {role.name} ·{' '}
                        {[
                          role.backend || data.backend,
                          role.backend_version || data.backend_version
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </Typography.Text>
                      <ParameterBlock
                        text={(
                          role.backend_parameters ??
                          configuration.backend_parameters ??
                          []
                        ).join('\n')}
                      />
                    </Flex>
                  ))}
                </Flex>
              )}
            </CardWrapper>
          </Col>
        ))}
      </Row>
    </Flex>
  );
};
export default ConfigurationTab;
