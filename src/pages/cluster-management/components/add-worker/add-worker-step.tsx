import useAddWorkerMessage from '@/pages/cluster-management/hooks/use-add-worker-message';
import { useIntl } from '@umijs/max';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import {
  isNoWorkerSelection,
  ProviderType,
  ProviderValueMap
} from '../../config';
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
  registeredGPUs?: string[];
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
    onClusterChange,
    registeredGPUs
  } = props || {};
  const intl = useIntl();

  const [collapseKey, setCollapseKey] = React.useState<Set<string>>(
    new Set([stepList[0]])
  );
  const { update, summary, register } = useSummaryStatus();
  const { createModelsChunkRequest } = useAddWorkerMessage();

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
  // Exception: K8s, where no vendor selected is a legitimate CPU-only
  // registration — there it is `noWorkerSelected` below that gates instead.
  const selectedGPUs =
    (summary.get('selectedGPUs') as string[] | undefined) || [];
  const currentGPU = (summary.get('currentGPU') as string | undefined) || '';
  const noVendorSelected = !currentGPU && selectedGPUs.length === 0;
  const isK8s = provider === ProviderValueMap.Kubernetes;

  // K8s only: neither the CPU Node card nor any GPU vendor, which would render
  // a release with no worker in it at all. The hardware step says so and greys
  // out its own Next; the downstream steps have to close with it, or jumping
  // straight to a panel header would walk right past both.
  const noWorkerSelected =
    isK8s &&
    isNoWorkerSelection({
      disableCpuWorker: summary.get('disableCpuWorker') === true,
      selectedGPUs:
        selectedGPUs.length > 0 ? selectedGPUs : currentGPU ? [currentGPU] : []
    });

  const blocked = noWorkerSelected || (noVendorSelected && !isK8s);
  const downstreamDisabled = disabled || blocked;

  React.useEffect(() => {
    // Collapse back to the hardware step when the selection stops being
    // installable, so the user is never left looking at a stale
    // disabled-but-open command panel.
    if (!blocked) return;
    setCollapseKey((prev) =>
      prev.has(StepNamesMap.SelectGPU)
        ? prev
        : new Set([StepNamesMap.SelectGPU])
    );
  }, [blocked]);

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
        registeredGPUs,
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
            {(isK8s || !noVendorSelected) && (
              <CheckEnvironment
                disabled={downstreamDisabled}
              ></CheckEnvironment>
            )}

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
        {/*
          No "workers added" alert here: the page flow renders it in
          FooterButtons, which reads workerAddedCountAtom — written by the watch
          started above. The modal flow renders its own in the drawer footer.
        */}
      </Container>
    </AddWorkerContext.Provider>
  );
};

export default AddWorkerSteps;
