import BaseSelect from '@/components/seal-form/base/select';
import { useIntl } from '@umijs/max';
import { useEffect } from 'react';
import { useAddWorkerContext } from './add-worker-context';
import { StepNamesMap } from './config';
import { Title } from './constainers';
import StepCollapse from './step-collapse';

const SelectCluster = () => {
  const {
    clusterList,
    registrationInfo,
    stepList,
    summary,
    onClusterChange,
    registerField,
    updateField
  } = useAddWorkerContext();
  const intl = useIntl();

  const clusterId = summary.get('cluster_id');

  const stepIndex = stepList.indexOf(StepNamesMap.SelectCluster) + 1;

  useEffect(() => {
    const unregister = registerField('cluster_id');
    return () => {
      unregister();
    };
  }, []);

  useEffect(() => {
    updateField('cluster_id', registrationInfo.cluster_id);
    // update cluster name in summary
    const selectedCluster = clusterList?.find(
      (item) => item.value === registrationInfo.cluster_id
    );
    updateField('clusterName', selectedCluster?.label || '');
  }, [registrationInfo.cluster_id]);

  return (
    <StepCollapse
      name={StepNamesMap.SelectCluster}
      title={
        <div>
          <Title>
            {stepIndex}.{' '}
            {intl.formatMessage({ id: 'clusters.addworker.selectCluster' })}
          </Title>
          <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
            {intl.formatMessage({
              id: 'clusters.addworker.selectCluster.tips'
            })}
          </span>
        </div>
      }
    >
      <BaseSelect
        defaultValue={registrationInfo.cluster_id}
        options={clusterList}
        value={clusterId}
        onChange={onClusterChange}
        style={{ width: '100%' }}
      />
    </StepCollapse>
  );
};

export default SelectCluster;
