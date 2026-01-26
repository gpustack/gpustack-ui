import StatusTag from '@/components/status-tag';
import { InstanceStatusMapValue, status } from '@/pages/llmodels/config';
import { convertFileSize } from '@/utils';
import { Descriptions } from 'antd';
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
    </Section>
  );
};

export default Instance;
