import useAddWorkerMessage from '@/pages/cluster-management/hooks/use-add-worker-message';
import { useIntl } from '@umijs/max';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { ProviderType, ProviderValueMap } from '../../config';
import { ClusterListItem } from '../../config/types';
import { AddWorkerContext } from './add-worker-context';
import AddedMessage from './added-message';
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
    // this effect is only triggered when used in cluster create page inner
    if (actionSource === 'page' && registrationInfo?.cluster_id) {
      createModelsChunkRequest({
        cluster_id: registrationInfo?.cluster_id
      });
    }
  }, [actionSource, registrationInfo?.cluster_id]);

  const disabled = useMemo(() => {
    return (
      stepList.includes(StepNamesMap.SelectCluster) && !clusterList?.length
    );
  }, [clusterList, stepList, StepNamesMap]);

  // Downstream steps (check env, run command, ...) only make sense after a
  // GPU vendor has been chosen. If the user toggled off every vendor in
  // multi-select, gate them shut so the wrong panel can't be opened.
  const selectedGPUs =
    (summary.get('selectedGPUs') as string[] | undefined) || [];
  const currentGPU = (summary.get('currentGPU') as string | undefined) || '';
  const noVendorSelected = !currentGPU && selectedGPUs.length === 0;
  const downstreamDisabled = disabled || noVendorSelected;

  React.useEffect(() => {
    // If the user just deselected everything, collapse any downstream
    // panel back to the GPU step so they aren't left looking at a stale
    // disabled-but-open command. Functional updater so we don't have to
    // depend on `collapseKey` and re-run the effect on every toggle.
    if (!noVendorSelected) return;
    setCollapseKey((prev) =>
      prev.has(StepNamesMap.SelectGPU)
        ? prev
        : new Set([StepNamesMap.SelectGPU])
    );
  }, [noVendorSelected]);

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
            <CheckEnvironment disabled={downstreamDisabled}></CheckEnvironment>

            {provider === ProviderValueMap.Kubernetes && (
              <K8sRunCommand disabled={downstreamDisabled}></K8sRunCommand>
            )}

            {provider === ProviderValueMap.Docker && (
              <>
                <SpecifyArguments
                  disabled={downstreamDisabled}
                ></SpecifyArguments>
                <DockerRunCommand
                  disabled={downstreamDisabled}
                ></DockerRunCommand>
              </>
            )}
          </>
        )}
        {actionSource === 'modal' && (
          //  show in cluster create page inner
          <AddedMessage addedCount={addedCount}></AddedMessage>
        )}
      </Container>
    </AddWorkerContext.Provider>
  );
};

export default AddWorkerSteps;
