import AutoTooltip from '@/components/auto-tooltip';
import { useIntl } from '@umijs/max';
import { Descriptions, Flex, Tag } from 'antd';
import React, { useMemo } from 'react';
import { useDetailContext } from '../../config/detail-context';

const Instance: React.FC = () => {
  const intl = useIntl();
  const { detailData } = useDetailContext();
  const [, instanceData] =
    Object.entries(detailData?.snapshot?.instances || {})[0] || [];

  const items = useMemo(() => {
    const { snapshot } = detailData;
    const [instanceName, instanceData] =
      Object.entries(snapshot?.instances || {})[0] || [];
    return [
      {
        key: '1',
        label: intl.formatMessage({ id: 'benchmark.detail.modelName' }),
        children: (
          <AutoTooltip ghost>{detailData?.model_name || '-'}</AutoTooltip>
        )
      },
      {
        key: '2',
        label: intl.formatMessage({ id: 'benchmark.detail.instanceName' }),
        children: (
          <AutoTooltip ghost>
            {detailData?.model_instance_name || '-'}
          </AutoTooltip>
        )
      },

      {
        key: '5',
        label: intl.formatMessage({ id: 'models.form.backend' }),
        children: `${instanceData?.backend || '-'} ${
          instanceData?.backend_version
            ? `(${instanceData?.backend_version})`
            : ''
        }`
      },
      {
        key: '6',
        label: intl.formatMessage({ id: 'benchmark.detail.modelFile' }),
        children: (
          <AutoTooltip ghost>{instanceData?.resolved_path || '-'}</AutoTooltip>
        )
      }
    ];
  }, [detailData]);

  const paramsItems = useMemo(() => {
    const { snapshot } = detailData;
    const [instanceName, instanceData] =
      Object.entries(snapshot?.instances || {})[0] || [];
    return [
      {
        key: '1',
        label: intl.formatMessage({ id: 'models.form.backend_parameters' }),
        children:
          instanceData?.backend_parameters &&
          instanceData?.backend_parameters.length > 0 ? (
            <Flex
              gap={8}
              wrap="wrap"
              style={{
                backgroundColor: 'var(--ant-color-fill-quaternary)',
                padding: '4px',
                borderRadius: '2px'
              }}
            >
              {instanceData?.backend_parameters?.map(
                (param: string, index: number) => (
                  <span key={index} style={{ margin: 0 }}>
                    {param}
                  </span>
                )
              )}
            </Flex>
          ) : (
            '-'
          )
      },
      {
        key: '3',
        label: intl.formatMessage({ id: 'benchmark.detail.kvCache' }),
        children: (
          <Flex gap={8} wrap="wrap">
            {instanceData?.extended_kv_cache?.enabled ? (
              <>
                {instanceData?.extended_kv_cache?.ram_ratio && (
                  <span className="flex-center">
                    <span>
                      {intl.formatMessage({ id: 'models.form.ramRatio' })}:
                    </span>
                    <span>{instanceData?.extended_kv_cache?.ram_ratio}</span>
                  </span>
                )}

                {instanceData?.extended_kv_cache?.ram_size && (
                  <span className="flex-center">
                    <span>
                      {intl.formatMessage({ id: 'models.form.ramSize' })}:
                    </span>
                    <span>{instanceData?.extended_kv_cache?.ram_size}</span>
                  </span>
                )}

                {instanceData?.extended_kv_cache?.chunk_size && (
                  <span className="flex-center">
                    <span>
                      {intl.formatMessage({ id: 'models.form.chunkSize' })}:
                    </span>
                    <span>{instanceData?.extended_kv_cache?.chunk_size}</span>
                  </span>
                )}
              </>
            ) : (
              '-'
            )}
          </Flex>
        )
      },
      {
        key: '2',
        label: intl.formatMessage({ id: 'models.form.env' }),
        children: (
          <Flex gap={8} wrap="wrap">
            {instanceData?.env
              ? Object.entries(instanceData?.env || {}).map(
                  ([key, value], index: number) => (
                    <Tag key={index} style={{ margin: 0 }}>
                      {`${key}=${value}`}
                    </Tag>
                  )
                )
              : '-'}
          </Flex>
        )
      },
      {
        key: '4',
        label: intl.formatMessage({
          id: 'benchmark.detail.speculativeDecoding'
        }),
        children: (
          <Flex gap={8} wrap="wrap">
            {instanceData?.speculative_config?.enabled ? (
              <>
                <span className="flex-center">
                  <span>
                    {intl.formatMessage({ id: 'models.form.algorithm' })}:
                  </span>
                  <span>{instanceData?.speculative_config?.algorithm}</span>
                </span>
                <span className="flex-center">
                  <span>
                    {intl.formatMessage({ id: 'models.form.draftModel' })}:
                  </span>
                  <span>{instanceData?.speculative_config?.draft_model}</span>
                </span>
                <span className="flex-center">
                  <span>
                    {intl.formatMessage({ id: 'models.form.numDraftTokens' })}:
                  </span>
                  <span>
                    {instanceData?.speculative_config?.num_draft_tokens}
                  </span>
                </span>
              </>
            ) : (
              '-'
            )}
          </Flex>
        )
      }
    ];
  }, [detailData]);

  return (
    <div>
      <Descriptions
        items={items}
        colon={false}
        column={4}
        layout="vertical"
        styles={{
          content: {
            justifyContent: 'flex-start'
          }
        }}
      ></Descriptions>
      <Descriptions
        style={{ marginTop: '12px' }}
        items={paramsItems}
        colon={false}
        column={2}
        layout="vertical"
        styles={{
          content: {
            justifyContent: 'flex-start'
          }
        }}
      ></Descriptions>
    </div>
  );
};

export default Instance;
