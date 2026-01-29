import AutoTooltip from '@/components/auto-tooltip';
import { Descriptions, Flex, Tag } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useDetailContext } from '../../config/detail-context';
import Title from './title';

const calcTotalVram = (vram: Record<string, number>) => {
  return _.sum(_.values(vram));
};

const Instance: React.FC = () => {
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
        label: 'Model Name',
        children: (
          <AutoTooltip ghost>{detailData?.model_name || '-'}</AutoTooltip>
        )
      },
      {
        key: '2',
        label: 'Instance Name',
        children: (
          <AutoTooltip ghost>
            {detailData?.model_instance_name || '-'}
          </AutoTooltip>
        )
      },

      {
        key: '5',
        label: 'Backend',
        children: `${instanceData?.backend || '-'} ${
          instanceData?.backend_version
            ? `(${instanceData?.backend_version})`
            : ''
        }`
      },
      {
        key: '6',
        label: 'Model File',
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
        label: 'Backend Parameters',
        children: (
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
        )
      },
      {
        key: '3',
        label: 'Extended KV Cache',
        children: (
          <Flex gap={8} wrap="wrap">
            {instanceData?.extended_kv_cache?.enabled ? (
              <>
                <span className="flex-center">
                  <span>RAM-to-VRAM Ratio:</span>
                  <span>{instanceData?.extended_kv_cache?.ram_ratio}</span>
                </span>
                <span className="flex-center">
                  <span>Maximum RAM Size (GiB):</span>
                  <span>{instanceData?.extended_kv_cache?.ram_size}</span>
                </span>
                <span className="flex-center">
                  <span>Size of Cache Chunks:</span>
                  <span>{instanceData?.extended_kv_cache?.chunk_size}</span>
                </span>
              </>
            ) : (
              '-'
            )}
          </Flex>
        )
      },
      {
        key: '4',
        label: 'Speculative Decoding',
        children: (
          <Flex gap={8} wrap="wrap">
            {instanceData?.speculative_config?.enabled ? (
              <>
                <span className="flex-center">
                  <span>Algorithm:</span>
                  <span>{instanceData?.speculative_config?.algorithm}</span>
                </span>
                <span className="flex-center">
                  <span>Draft Model:</span>
                  <span>{instanceData?.speculative_config?.draft_model}</span>
                </span>
                <span className="flex-center">
                  <span>Number of Draft Tokens:</span>
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
      },
      {
        key: '2',
        label: 'Environment Variables',
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
      }
    ];
  }, [detailData]);

  return (
    <div>
      <Title>Instance</Title>
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
