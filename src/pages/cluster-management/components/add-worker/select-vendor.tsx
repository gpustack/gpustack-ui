import {
  AddWorkerDockerNotes,
  GPUDriverMap,
  GPUsConfigs
} from '@/pages/resources/config/gpu-driver';
import { useIntl } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import { ProviderValueMap } from '../../config';
import SupportedGPUs, { useSupportedGPUList } from '../support-gpus';
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

  // K8s clusters render one worker DaemonSet per requested GPU runtime and
  // derive each DaemonSet's nodeSelector from the vendor's PCI-presence label
  // at manifest time, so multiple vendors can be registered without any
  // per-cluster override config. Multi-select is therefore always available
  // for the Kubernetes provider; other providers stay single-select.
  const multiCapable = provider === ProviderValueMap.Kubernetes;

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

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
    return () => {
      unregister1();
      unregister2();
      unregister3();
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
    if (multiCapable) return [...prev, key];
    return [key];
  };

  const applySelection = (keys: string[]) => {
    const primary = keys[0] || '';
    updateField('currentGPU', primary);
    updateField('selectedGPUs', keys);
    updateField(
      'workerCommand',
      primary ? buildWorkerCommand(primary, vendorMeta[primary]) : null
    );
    setSelectedKeys(keys);
  };

  const handleSelect = (key: string) => {
    applySelection(buildSelectedKeys(key));
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
      ? multiCapable
        ? registeredGPUs
        : registeredGPUs.slice(0, 1)
      : [GPUDriverMap.NVIDIA];
    applySelection(registered);
  }, [registeredGPUs]);

  return (
    <StepCollapse
      disabled={disabled}
      name={StepNamesMap.SelectGPU}
      title={
        <Title>
          {stepIndex}.{' '}
          {intl.formatMessage({ id: 'clusters.addworker.selectGPU' })}
          {multiCapable && (
            <span
              style={{
                marginLeft: 8,
                fontWeight: 400,
                fontSize: 13,
                color: 'var(--ant-color-text-secondary)'
              }}
            >
              {intl.formatMessage({
                id: 'clusters.addworker.selectGPU.subtitle'
              })}
            </span>
          )}
        </Title>
      }
    >
      <SupportedGPUs
        onSelect={handleSelect}
        current={selectedKeys}
        availableKeys={availableKeys}
        clickable={true}
      />
    </StepCollapse>
  );
};

export default SelectVendor;
