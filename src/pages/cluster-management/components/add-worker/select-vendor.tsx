import {
  AddWorkerDockerNotes,
  GPUDriverMap,
  GPUsConfigs
} from '@/pages/resources/config/gpu-driver';
import { useIntl } from '@umijs/max';
import React, { useEffect, useRef, useState } from 'react';
import { ProviderValueMap } from '../../config';
import SupportedGPUs from '../support-gpus';
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
  const { stepList, registerField, updateField, provider } =
    useAddWorkerContext();
  const intl = useIntl();

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

  // Cache vendor metadata (label/link from SupportedGPUs items) so we can
  // rebuild workerCommand on toggle without re-clicking the card.
  const itemMetaRef = useRef<Record<string, { label: string; link: string }>>(
    {}
  );

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

  const updateFieldsOnSelect = (keys: string[]) => {
    const primary = keys[0] || '';
    updateField('currentGPU', primary);
    updateField('selectedGPUs', keys);
    updateField(
      'workerCommand',
      primary ? buildWorkerCommand(primary, itemMetaRef.current[primary]) : null
    );
  };

  const handleSelect = (key: string, item: any) => {
    if (item) {
      itemMetaRef.current[key] = {
        label: item.label,
        link: item.link
      };
    }
    const keys = buildSelectedKeys(key);
    updateFieldsOnSelect(keys);
    setSelectedKeys(keys);
  };

  useEffect(() => {
    // K8s clusters allow selecting none (CPU-only workers), so skip default
    // selection. Other providers still default to NVIDIA.
    if (multiCapable) return;
    handleSelect(GPUDriverMap.NVIDIA, {
      label: 'NVIDIA',
      hiddenTitle: true,
      value: GPUDriverMap.NVIDIA,
      description: '',
      key: GPUDriverMap.NVIDIA,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.NVIDIA],
      link: 'https://docs.gpustack.ai/latest/installation/requirements/#nvidia-gpu'
    });
  }, []);

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
