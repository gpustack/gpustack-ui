import { formatLargeNumber } from '@/utils';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { AutoTooltip, SimpleSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Segmented, Table, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { queryCacheServiceMetrics, queryCacheServiceModels } from '../apis';
import {
  CacheServiceAttachedMetrics,
  CacheServiceModelItem
} from '../config/types';
import SubTitle from './sub-title';

const POLL_INTERVAL = 60 * 1000;
const WINDOW_OPTIONS = ['30m', '1h', '6h', '24h'];

const formatPercent = (value: number | null | undefined) =>
  value == null ? '-' : `${_.round(value * 100, 1)}%`;

// abbreviated like the usage pages' token counts (1.2K / 3.4M); the
// exact figure rides on the hover title
const formatTokens = (value: number | null | undefined) => {
  if (value == null) {
    return '-';
  }
  const exact = _.round(value);
  return <span title={exact.toLocaleString()}>{formatLargeNumber(exact)}</span>;
};

// one row per attached model instance: the row set comes from the
// database (via the metrics endpoint), the hit accounting from the
// engine's own counters where they exist
const ServiceDeployments: React.FC<{ serviceId: number }> = ({ serviceId }) => {
  const intl = useIntl();
  const [window, setWindow] = useState('1h');
  // empty selection = every worker; rows filter client-side (the row
  // set is small and already carries worker_name)
  const [workers, setWorkers] = useState<string[]>([]);
  const [models, setModels] = useState<CacheServiceModelItem[]>([]);
  const [attached, setAttached] = useState<CacheServiceAttachedMetrics[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serviceId) {
      setModels([]);
      return;
    }
    let active = true;
    const fetchModels = async () => {
      try {
        const res = await queryCacheServiceModels(serviceId);
        if (active) {
          setModels(res?.items || []);
        }
      } catch (error) {
        if (active) {
          setModels([]);
        }
      }
    };
    fetchModels();
    return () => {
      active = false;
    };
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId) {
      setAttached([]);
      setLoading(false);
      return;
    }
    let active = true;
    const fetchAttached = async () => {
      setLoading(true);
      try {
        const res = await queryCacheServiceMetrics(serviceId, { window });
        if (active) {
          setAttached(res?.attached || []);
        }
      } catch (error) {
        // metrics are owner-level and optional; the table renders
        // without the hit-rate data
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchAttached();
    const timer = setInterval(fetchAttached, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [serviceId, window]);

  const workerOptions = useMemo(
    () =>
      _.uniq(
        attached.map((row) => row.worker_name).filter(Boolean)
      ) as string[],
    [attached]
  );
  const visibleRows = workers.length
    ? attached.filter(
        (row) => row.worker_name && workers.includes(row.worker_name)
      )
    : attached;

  const backendByModel = useMemo(
    () =>
      _.fromPairs(models.map((model) => [model.id, model.backend])) as Record<
        number,
        string
      >,
    [models]
  );

  const titleWithTips = (titleId: string, tipsId: string) => (
    <span>
      {intl.formatMessage({ id: titleId })}{' '}
      <Tooltip title={intl.formatMessage({ id: tipsId })}>
        <QuestionCircleOutlined style={{ opacity: 0.6 }} />
      </Tooltip>
    </span>
  );

  const columns = [
    {
      title: intl.formatMessage({ id: 'common.table.name' }),
      dataIndex: 'model_instance_name',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: intl.formatMessage({ id: 'kvCache.table.worker' }),
      dataIndex: 'worker_name',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text || '-'}
        </AutoTooltip>
      )
    },
    {
      title: intl.formatMessage({ id: 'models.form.backend' }),
      key: 'backend',
      render: (_text: unknown, record: CacheServiceAttachedMetrics) =>
        (record.model_id != null && backendByModel[record.model_id]) || '-'
    },
    {
      title: titleWithTips(
        'kvCache.detail.hitTokens',
        'kvCache.detail.hitTokens.tips'
      ),
      dataIndex: 'hit_tokens',
      render: formatTokens
    },
    {
      title: titleWithTips(
        'kvCache.detail.queriedTokens',
        'kvCache.detail.queriedTokens.tips'
      ),
      dataIndex: 'queried_tokens',
      render: formatTokens
    },
    {
      title: titleWithTips(
        'kvCache.detail.hitRate',
        'kvCache.detail.hitRate.engineTips'
      ),
      dataIndex: 'hit_rate',
      // an engine that exports counters but saw no queries reads 0%;
      // "-" stays for engines without the counters at all
      render: (value: number | null, record: CacheServiceAttachedMetrics) =>
        formatPercent(value ?? (record.queried_tokens != null ? 0 : null))
    }
  ];

  return (
    <div>
      {/* the flex header replaces the SubTitle's own block margins, so
          it carries the same section rhythm (24 above, 16 below) */}
      <Flex
        align="center"
        justify="space-between"
        style={{ marginBlock: '24px 16px' }}
      >
        <SubTitle style={{ marginBlock: 0 }}>
          {intl.formatMessage({ id: 'kvCache.detail.modelInstances' })}
        </SubTitle>
        <Flex align="center" gap={12}>
          {(workerOptions.length > 1 || workers.length > 0) && (
            <SimpleSelect
              allowClear
              showSearch
              mode="multiple"
              maxTagCount={'responsive'}
              options={workerOptions.map((name) => ({
                label: name,
                value: name
              }))}
              placeholder={intl.formatMessage({ id: 'kvCache.table.worker' })}
              styles={{
                wrapper: { maxWidth: 280, minWidth: 150 }
              }}
              value={workers}
              onChange={(value: string[]) => setWorkers(value || [])}
            />
          )}
          <Segmented
            size="small"
            options={WINDOW_OPTIONS}
            value={window}
            onChange={(value) => setWindow(value as string)}
          />
        </Flex>
      </Flex>
      <Table
        rowKey="model_instance_name"
        tableLayout="fixed"
        columns={columns}
        dataSource={visibleRows}
        loading={loading && !attached.length}
        pagination={false}
      ></Table>
    </div>
  );
};

export default ServiceDeployments;
