import useAddWorkerMessage from '@/pages/cluster-management/hooks/use-add-worker-message';
import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { ProviderType, ProviderValueMap } from '../../config';
import { ClusterListItem } from '../../config/types';
import { AddWorkerContext } from './add-worker-context';
import CheckEnvironment from './check-environment';
import { StepName, StepNamesMap } from './config';
import DockerRunCommand from './docker-run-command';
import K8sRunCommand from './k8s-run-command';
import SelectCluster from './select-cluster';
import SelectVendor from './select-vendor';
import SpecifyArguments from './specify-arguments';
import useSummaryStatus from './use-summary-status';

const Container = styled.div`
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  .command-info {
    margin-bottom: 8px;
  }
`;
/**
 * clusterList and onClusterChange are only required when from worker page.
 */
type AddWorkerProps = {
  actionSource?: 'modal' | 'page';
  provider: ProviderType;
  clusterList?: Global.BaseOption<number, ClusterListItem>[];
  clusterLoading?: boolean;
  stepList: StepName[];
  onClusterChange?: (value: number, row?: any) => void;
  onCancel?: () => void;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number | null;
    [key: string]: any;
  };
};

/**
 * both add worker and register cluster use this component
 * @param props
 * @returns
 */
const AddWorkerSteps: React.FC<AddWorkerProps> = (props) => {
  const {
    actionSource,
    registrationInfo,
    provider,
    clusterList,
    clusterLoading,
    stepList = [],
    onCancel,
    onClusterChange
  } = props || {};
  const intl = useIntl();

  const [collapseKey, setCollapseKey] = React.useState<Set<string>>(
    new Set([stepList[0]])
  );
  const { update, summary, register } = useSummaryStatus();
  const { addedCount, createModelsChunkRequest } = useAddWorkerMessage();

  const onToggle = (open: boolean, key: string) => {
    setCollapseKey(open ? new Set([key]) : new Set());
  };

  const handleOnClusterChange = (value: number, row?: any) => {
    onClusterChange?.(value, row);
  };

  React.useEffect(() => {
    // reset collapseKey when stepList changes
    setCollapseKey(new Set([stepList[0]]));
  }, [stepList]);

  React.useEffect(() => {
    // this effect is only triggered when used in cluster create page
    if (actionSource === 'page') {
      createModelsChunkRequest();
    }
  }, [actionSource]);

  const renderMessage = (count: number) => {
    if (count === 1) {
      return intl.formatMessage(
        {
          id: 'clusters.addworker.message.success_single'
        },
        { count: addedCount }
      );
    }
    return intl.formatMessage(
      {
        id: 'clusters.addworker.message.success_multiple'
      },
      { count: addedCount }
    );
  };

  const disabled = useMemo(() => {
    return (
      stepList.includes(StepNamesMap.SelectCluster) && !clusterList?.length
    );
  }, [clusterList, stepList, StepNamesMap]);

  return (
    <AddWorkerContext.Provider
      value={{
        clusterList,
        clusterLoading,
        provider,
        stepList: stepList,
        collapseKey,
        actionSource,
        onToggle,
        onCancel,
        onClusterChange: handleOnClusterChange,
        registrationInfo,
        summary,
        registerField: register,
        updateField: update
      }}
    >
      <Container>
        {stepList.includes(StepNamesMap.SelectCluster) && (
          <SelectCluster disabled={disabled}></SelectCluster>
        )}
        {/* render the steps only when there is at least one cluster available or cluster selection is not required */}
        {((clusterList && clusterList.length > 0) ||
          !stepList.includes(StepNamesMap.SelectCluster)) && (
          <>
            <SelectVendor disabled={disabled}></SelectVendor>
            <CheckEnvironment disabled={disabled}></CheckEnvironment>

            {provider === ProviderValueMap.Kubernetes && (
              <K8sRunCommand disabled={disabled}></K8sRunCommand>
            )}

            {provider === ProviderValueMap.Docker && (
              <>
                <SpecifyArguments disabled={disabled}></SpecifyArguments>
                <DockerRunCommand disabled={disabled}></DockerRunCommand>
              </>
            )}
          </>
        )}
        {addedCount > 0 && (
          <Alert
            style={{
              textAlign: 'left',
              borderColor: 'var(--ant-color-success)',
              width: '100%'
            }}
            type="success"
            title={renderMessage(addedCount)}
            closable
          />
        )}
      </Container>
    </AddWorkerContext.Provider>
  );
};

export default AddWorkerSteps;
