import BaseSelect from '@/components/seal-form/base/select';
import { useIntl } from '@umijs/max';
import { Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useAddWorkerContext } from './add-worker-context';
import { AddWorkerStepProps, StepNamesMap } from './config';
import { Title } from './constainers';
import StepCollapse from './step-collapse';

const SelectCluster: React.FC<AddWorkerStepProps> = ({ disabled }) => {
  const {
    clusterList,
    clusterLoading,
    registrationInfo,
    stepList,
    summary,
    onClusterChange,
    registerField,
    updateField
  } = useAddWorkerContext();
  const intl = useIntl();

  const [clusterId, setClusterId] = useState<number | null>(
    summary.get('cluster_id')
  );

  const stepIndex = stepList.indexOf(StepNamesMap.SelectCluster) + 1;

  const handleOnClusterChange = (value: number, option: any) => {
    setClusterId(value);
    onClusterChange?.(value, option);
  };

  useEffect(() => {
    const unregister = registerField('cluster_id');
    return () => {
      unregister();
    };
  }, []);

  useEffect(() => {
    updateField('cluster_id', registrationInfo.cluster_id);
    // update cluster name in summary
    setClusterId(registrationInfo.cluster_id);
    const selectedCluster = clusterList?.find(
      (item) => item.value === registrationInfo.cluster_id
    );
    updateField('clusterName', selectedCluster?.label || '');
  }, [registrationInfo.cluster_id]);

  return (
    <StepCollapse
      disabled={disabled}
      name={StepNamesMap.SelectCluster}
      title={
        <div>
          <Title>
            {stepIndex}.{' '}
            {intl.formatMessage({ id: 'clusters.addworker.selectCluster' })}
          </Title>
          <Typography.Paragraph
            type="secondary"
            style={{
              marginBottom: 0,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.2,
              paddingBlock: 4
            }}
            ellipsis={{ rows: 2 }}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: intl.formatMessage({
                  id: 'clusters.addworker.selectCluster.tips'
                })
              }}
            ></span>
          </Typography.Paragraph>
        </div>
      }
    >
      <Spin spinning={clusterLoading}>
        <BaseSelect
          defaultValue={registrationInfo.cluster_id}
          options={clusterList}
          value={clusterId}
          onChange={handleOnClusterChange}
          style={{ width: '100%' }}
        />
        {!clusterLoading && !clusterList?.length && (
          <Typography.Text type="danger">
            {intl.formatMessage({ id: 'clusters.addworker.noClusters' })}
          </Typography.Text>
        )}
      </Spin>
    </StepCollapse>
  );
};

export default SelectCluster;
