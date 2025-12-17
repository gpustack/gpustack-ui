import AlertInfoBlock from '@/components/alert-info/block';
import useAddWorkerMessage from '@/pages/cluster-management/hooks/use-add-worker-message';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React from 'react';
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
  isModal?: boolean;
  provider: ProviderType;
  clusterList?: Global.BaseOption<number, ClusterListItem>[];
  clusterLoading?: boolean;
  stepList: StepName[];
  onClusterChange?: (value: number, row?: any) => void;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number;
  };
};

/**
 * both add worker and register cluster use this component
 * @param props
 * @returns
 */
const AddWorkerSteps: React.FC<AddWorkerProps> = (props) => {
  const {
    isModal = false,
    registrationInfo,
    provider,
    clusterList,
    clusterLoading,
    stepList = [],
    onClusterChange
  } = props || {};
  const intl = useIntl();

  const [collapseKey, setCollapseKey] = React.useState<Set<string>>(
    new Set([stepList[0]])
  );
  const startWatchRef = React.useRef(false);
  const { update, summary, register } = useSummaryStatus();
  const { addedCount, createModelsChunkRequest } = useAddWorkerMessage({
    startWatch: startWatchRef
  });

  const onToggle = (open: boolean, key: string) => {
    setCollapseKey(open ? new Set([key]) : new Set());
    if (key === StepNamesMap.RunCommand && open) {
      startWatchRef.current = true;
    }
  };

  const handleOnClusterChange = (value: number, row?: any) => {
    onClusterChange?.(value, row);
  };

  React.useEffect(() => {
    // reset collapseKey when stepList changes
    setCollapseKey(new Set([stepList[0]]));
  }, [stepList]);

  React.useEffect(() => {
    if (!isModal) {
      createModelsChunkRequest();
    }
  }, [isModal]);

  return (
    <AddWorkerContext.Provider
      value={{
        clusterList,
        clusterLoading,
        provider,
        stepList: stepList,
        collapseKey,
        onToggle,
        onClusterChange: handleOnClusterChange,
        registrationInfo,
        summary,
        registerField: register,
        updateField: update
      }}
    >
      <Container>
        {stepList.includes(StepNamesMap.SelectCluster) && (
          <SelectCluster></SelectCluster>
        )}
        {stepList.includes(StepNamesMap.SelectCluster) &&
          !clusterList?.length && (
            <AlertInfoBlock
              maxHeight={200}
              style={{ marginBottom: 8 }}
              type="warning"
              icon={<ExclamationCircleFilled />}
              message={intl.formatMessage({
                id: 'resources.worker.noCluster.tips'
              })}
            ></AlertInfoBlock>
          )}

        {/* render the steps only when there is at least one cluster available or cluster selection is not required */}
        {((clusterList && clusterList.length > 0) ||
          !stepList.includes(StepNamesMap.SelectCluster)) && (
          <>
            <SelectVendor></SelectVendor>
            <CheckEnvironment></CheckEnvironment>

            {provider === ProviderValueMap.Kubernetes && (
              <K8sRunCommand></K8sRunCommand>
            )}

            {provider === ProviderValueMap.Docker && (
              <>
                <SpecifyArguments></SpecifyArguments>
                <DockerRunCommand></DockerRunCommand>
              </>
            )}
          </>
        )}
        {addedCount > 0 && (
          <Alert
            message={intl.formatMessage(
              {
                id: 'clusters.addworker.message.success'
              },
              { count: addedCount }
            )}
            type="warning"
          />
        )}
      </Container>
    </AddWorkerContext.Provider>
  );
};

export default AddWorkerSteps;
