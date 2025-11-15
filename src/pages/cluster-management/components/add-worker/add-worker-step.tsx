import AlertInfoBlock from '@/components/alert-info/block';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
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
  provider: ProviderType;
  clusterList?: Global.BaseOption<number, ClusterListItem>[];
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
    registrationInfo,
    provider,
    clusterList,
    stepList = [],
    onClusterChange
  } = props || {};
  const intl = useIntl();
  const { update, summary, register } = useSummaryStatus();

  const [collapseKey, setCollapseKey] = React.useState<Set<string>>(
    new Set([stepList[0]])
  );

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

  return (
    <AddWorkerContext.Provider
      value={{
        clusterList,
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
      </Container>
    </AddWorkerContext.Provider>
  );
};

export default AddWorkerSteps;
