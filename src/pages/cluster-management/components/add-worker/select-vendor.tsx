import {
  AddWorkerDockerNotes,
  GPUDriverMap,
  GPUsConfigs
} from '@/pages/resources/config/gpu-driver';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { AlertBlockInfo } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import { isNoWorkerSelection, ProviderValueMap } from '../../config';
import SupportedGPUs, {
  CPU_NODE_KEY,
  useSupportedGPUList
} from '../support-gpus';
import { useAddWorkerContext } from './add-worker-context';
import { AddWorkerStepProps, StepNamesMap } from './config';
import { Title } from './constainers';
import StepCollapse from './step-collapse';

const buildWorkerCommand = (
  driverKey: string,
  itemHint?: { label?: string; link?: string }
) => ({
  label: itemHint?.label || GPUsConfigs[driverKey]?.label || driverKey,
  link: itemHint?.link || '',
  notes: AddWorkerDockerNotes[driverKey] || []
});

const SelectVendor: React.FC<AddWorkerStepProps> = ({ disabled }) => {
  const { stepList, registerField, updateField, provider, registeredGPUs } =
    useAddWorkerContext();
  const intl = useIntl();
  const supportedGPUList = useSupportedGPUList();

  const stepIndex = stepList.indexOf(StepNamesMap.SelectGPU) + 1;

  // Kubernetes drives both of this step's differences, so one flag carries
  // them. It renders one worker DaemonSet per requested GPU runtime and
  // derives each DaemonSet's nodeSelector from the vendor's PCI-presence label
  // at manifest time, so several vendors can be registered with no per-cluster
  // override config — hence multi-select, where other providers stay
  // single-select. It is also the only provider with a CPU worker DaemonSet to
  // keep or drop, hence the CPU Node card: Docker's Add Worker installs onto a
  // single host and has nothing to opt out of.
  const isKubernetes = provider === ProviderValueMap.Kubernetes;

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  // The card is the inverse of what goes on the wire: selected keeps the CPU
  // worker DaemonSet, unselected sends `disable_cpu_worker=true`.
  //
  // Unselected is the default for a *new* registration — deliberately the
  // opposite of the chart's own `worker.cpuEnabled: true`, and a change of
  // behaviour rather than a mirror of it. The CPU worker was part of how an
  // upgrade got carried when registration shipped raw manifests; registration
  // now installs a Helm release whose in-cluster bootstrap Job reconciles the
  // requested configuration against what is installed (see `appliedRevision`),
  // so that job belongs elsewhere and a CPU-only node earns a worker only when
  // someone asks for one.
  //
  // Unselected for every cluster, including one already running a CPU worker.
  // Note what that means: the command reconciles the release, so re-running it
  // with the card off *removes* a running CPU worker rather than merely not
  // adding one. Seeding the card from the cluster would avoid that, but the
  // only available signal is "a worker reporting no `gpu_devices`", which is
  // an inference — a GPU worker that has not reported its devices yet reads
  // the same. Left unseeded until a worker says which DaemonSet placed it;
  // guessing here would put a guess into a destructive default.
  const [cpuSelected, setCpuSelected] = useState(false);

  // No vendor is gated anymore — every card stays selectable.
  const availableKeys = undefined;

  // Vendor metadata keyed by driver key, so a selection made without a click —
  // the cluster's already-registered vendors — resolves the same label and docs
  // link that clicking the card would.
  const vendorMeta = supportedGPUList.reduce<
    Record<string, { label: string; link: string }>
  >((acc, item) => {
    acc[item.value] = { label: item.label, link: item.link };
    return acc;
  }, {});

  useEffect(() => {
    const unregister1 = registerField('currentGPU');
    const unregister2 = registerField('workerCommand');
    const unregister3 = registerField('selectedGPUs');
    const unregister4 = registerField('disableCpuWorker');
    return () => {
      unregister1();
      unregister2();
      unregister3();
      unregister4();
    };
  }, []);

  const buildSelectedKeys = (key: string) => {
    const prev = [...selectedKeys];
    const has = prev.includes(key);
    if (has) {
      // Clicking a selected card always toggles it off.
      return prev.filter((v) => v !== key);
    }
    // K8s clusters support multiple GPU runtimes, so accumulate picks.
    // Other providers stay single-select and replace the current pick.
    if (isKubernetes) return [...prev, key];
    return [key];
  };

  const applySelection = (keys: string[], cpuOn: boolean) => {
    const primary = keys[0] || '';
    updateField('currentGPU', primary);
    updateField('selectedGPUs', keys);
    if (isKubernetes) {
      updateField('disableCpuWorker', !cpuOn);
    }
    updateField(
      'workerCommand',
      primary ? buildWorkerCommand(primary, vendorMeta[primary]) : null
    );
    setSelectedKeys(keys);
    setCpuSelected(cpuOn);
  };

  const handleSelect = (key: string) => {
    // The CPU Node card toggles the manifest's CPU worker DaemonSet; it is not
    // a GPU runtime, so it never enters `selectedKeys`.
    if (key === CPU_NODE_KEY) {
      applySelection(selectedKeys, !cpuSelected);
      return;
    }
    applySelection(buildSelectedKeys(key), cpuSelected);
  };

  useEffect(() => {
    // A cluster registered with a non-NVIDIA vendor has to come back with that
    // vendor selected — re-registering against the NVIDIA default produces a
    // command the node can't register with. Single-select providers take the
    // first vendor found, which is the only one on a homogeneous cluster.
    // Clusters whose workers report no GPU (and the create-cluster flow, which
    // has no workers yet) keep the NVIDIA default; users can still deselect it
    // for CPU-only workers, or add more vendors on K8s.
    const registered = registeredGPUs?.length
      ? isKubernetes
        ? registeredGPUs
        : registeredGPUs.slice(0, 1)
      : [GPUDriverMap.NVIDIA];
    // Selecting another cluster also puts the CPU Node card back to its
    // default, so a choice made for one cluster never carries over. Only the
    // vendors are seeded from the cluster; see the card's state above for why
    // the CPU side is not.
    applySelection(registered, false);
  }, [registeredGPUs]);

  // Reported here rather than beside the command it invalidates: the steps are
  // an accordion, so a message in the Run Command panel could never be on
  // screen together with the cards that cause it — and the cards are where the
  // user fixes it.
  const noWorkerSelected =
    isKubernetes &&
    isNoWorkerSelection({
      disableCpuWorker: !cpuSelected,
      selectedGPUs: selectedKeys
    });

  return (
    <StepCollapse
      disabled={disabled}
      nextDisabled={noWorkerSelected}
      name={StepNamesMap.SelectGPU}
      title={
        <Title>
          {stepIndex}.{' '}
          {intl.formatMessage({
            id: isKubernetes
              ? 'clusters.addworker.selectHardware'
              : 'clusters.addworker.selectGPU'
          })}
          {isKubernetes && (
            <span
              style={{
                marginLeft: 8,
                fontWeight: 400,
                fontSize: 13,
                color: 'var(--ant-color-text-secondary)'
              }}
            >
              {intl.formatMessage({
                id: 'clusters.addworker.selectHardware.subtitle'
              })}
            </span>
          )}
        </Title>
      }
    >
      <SupportedGPUs
        onSelect={handleSelect}
        current={
          isKubernetes && cpuSelected
            ? [...selectedKeys, CPU_NODE_KEY]
            : selectedKeys
        }
        availableKeys={availableKeys}
        includeCPU={isKubernetes}
        clickable={true}
      />
      {noWorkerSelected && (
        <AlertBlockInfo
          type="danger"
          ellipsis={false}
          style={{ marginTop: 16 }}
          icon={<ExclamationCircleFilled />}
          message={intl.formatMessage({
            id: 'clusters.addworker.noWorkerSelected.error'
          })}
        ></AlertBlockInfo>
      )}
    </StepCollapse>
  );
};

export default SelectVendor;
