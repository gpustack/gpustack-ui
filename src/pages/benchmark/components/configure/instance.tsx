import StatusTag from '@/components/status-tag';
import { InstanceStatusMapValue, status } from '@/pages/llmodels/config';
import { convertFileSize } from '@/utils';
import { Descriptions, Flex, Tag } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useDetailContext } from '../../config/detail-context';
import Section from '../summary/section';

const calcTotalVram = (vram: Record<string, number>) => {
  return _.sum(_.values(vram));
};

const Instance: React.FC = () => {
  const { detailData } = useDetailContext();

  const items = useMemo(() => {
    const { snapshot } = detailData;
    const [instanceName, instanceData] =
      Object.entries(snapshot.instances || {})[0] || [];
    return [
      {
        key: '1',
        label: 'Instance Name',
        children: (
          <div className="flex-center gap-8">
            <span>{instanceName}</span>
            <StatusTag
              statusValue={{
                status: status[instanceData.state],
                text: InstanceStatusMapValue[instanceData.state],
                message: detailData.state_message || undefined
              }}
            />
          </div>
        )
      },
      {
        key: '2',
        label: 'Worker',
        children: instanceData?.worker_name || '-'
        // children:
        //   instanceData?.ports?.length > 0
        //     ? `${instanceData.worker_ip}:${instanceData.ports[0]}`
        //     : instanceData.worker_ip || '-'
      },
      {
        key: '3',
        label: 'GPU Indexes',
        children:
          _.join(
            instanceData.gpu_indexes?.sort?.((a, b) => a - b),
            ','
          ) || '-'
      },
      {
        key: '6',
        label: 'GPU Type',
        children: instanceData?.gpu_type || '-'
      },
      {
        key: '4',
        label: 'Allocated VRAM',
        children:
          convertFileSize(
            instanceData.computed_resource_claim?.vram
              ? calcTotalVram(instanceData.computed_resource_claim?.vram)
              : 0,
            1
          ) || '-'
      },
      {
        key: '5',
        label: 'Backend',
        children: `${instanceData?.backend || '-'} ${
          instanceData.backend_version
            ? `(${instanceData.backend_version})`
            : ''
        }`
      }
    ];
  }, [detailData]);

  const paramsItems = useMemo(() => {
    const { snapshot } = detailData;
    const [instanceName, instanceData] =
      Object.entries(snapshot.instances || {})[0] || [];
    return [
      {
        key: '1',
        label: 'Backend Parameters',
        children: (
          <Flex gap={8} wrap="wrap">
            {instanceData?.backend_parameters.map(
              (param: string, index: number) => (
                <Tag key={index} style={{ margin: 0 }}>
                  {param}
                </Tag>
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
    <Section title="Model Instance">
      <Descriptions
        items={items}
        colon={false}
        column={3}
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
    </Section>
  );
};

export default Instance;
