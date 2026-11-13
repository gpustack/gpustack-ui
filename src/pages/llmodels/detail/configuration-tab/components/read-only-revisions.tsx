import { GSDrawer } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Descriptions, Flex, Select, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import type { ListItem } from '../../../config/types';
import { dumpDeploymentConfig } from '../../../utils/deployment-yaml';
import HelpTooltip from '../../components/help-tooltip';
import useReadOnlyRevisions from '../hooks/use-read-only-revisions';

export default function ReadOnlyRevisions({ model }: { model: ListItem }) {
  const intl = useIntl();
  const history = useReadOnlyRevisions(model);
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const latest = history.list?.data?.items[0];
  const pending = !history.list || history.list.loading;
  const unavailable = t('metadataUnavailable');
  const revisionLabel = (revision: number) =>
    intl.formatMessage({ id: 'models.revisions.target' }, { revision });
  return (
    <>
      <Descriptions
        column={1}
        items={[
          {
            key: 'revision',
            label: t('configurationRevision'),
            children: pending ? (
              <Spin size="small" />
            ) : latest ? (
              revisionLabel(latest.revision)
            ) : (
              unavailable
            )
          },
          {
            key: 'created',
            label: t('revisionCreated'),
            children: latest?.created_at
              ? dayjs(latest.created_at).format('YYYY-MM-DD HH:mm:ss')
              : '—'
          }
        ]}
      />
      {history.list?.stale && (
        <Typography.Text type="warning">{t('stale')}</Typography.Text>
      )}
      <Flex gap={8} wrap>
        <Button
          type="link"
          size="small"
          disabled={!latest || pending}
          onClick={() => latest && history.select(latest.revision)}
        >
          {intl.formatMessage({ id: 'models.revisions.title' })} →
        </Button>
        <Button
          type="link"
          size="small"
          loading={pending}
          onClick={() => void history.reload()}
        >
          {t('refresh')}
        </Button>
      </Flex>
      <GSDrawer
        title={
          <Flex component="span" align="center" gap={4}>
            <span>
              {intl.formatMessage(
                { id: 'models.revisions.titleWithName' },
                { name: model.name }
              )}
            </span>
            <HelpTooltip
              label={t('readOnlyHistory')}
              content={t('readOnlyHistory')}
            />
          </Flex>
        }
        open={history.selected != null}
        onClose={history.clear}
        destroyOnHidden
        styles={{
          wrapper: { width: 840, maxWidth: '100vw' },
          body: { paddingInline: 'var(--ant-padding-lg)' }
        }}
      >
        <Flex vertical gap={16}>
          <Typography.Text type="secondary">
            {intl.formatMessage(
              { id: 'modelMonitoring.loadedRevisions' },
              { count: history.list?.data?.items.length || 0 }
            )}
          </Typography.Text>
          {history.list?.stale && (
            <Typography.Text type="warning">{t('stale')}</Typography.Text>
          )}
          <Flex gap={8} wrap>
            <Select
              aria-label={t('configurationRevision')}
              value={history.selected}
              options={(history.list?.data?.items || []).map((item) => ({
                value: item.revision,
                label: `${revisionLabel(item.revision)} · ${dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}`
              }))}
              onChange={history.select}
              style={{ flex: '1 1 240px' }}
            />
            <Button
              loading={history.list?.loading}
              onClick={() => void history.reload()}
            >
              {t('refresh')}
            </Button>
          </Flex>
          {!history.detail || history.detail.loading ? (
            <Spin />
          ) : history.detail.error || !history.detail.data ? (
            <Typography.Text type="secondary">{unavailable}</Typography.Text>
          ) : (
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                overflow: 'auto',
                maxHeight: '65vh',
                padding: 'var(--ant-padding)',
                background: 'var(--ant-color-fill-quaternary)',
                borderRadius: 'var(--ant-border-radius)'
              }}
            >
              {dumpDeploymentConfig(history.detail.data.spec)}
            </pre>
          )}
        </Flex>
      </GSDrawer>
    </>
  );
}
