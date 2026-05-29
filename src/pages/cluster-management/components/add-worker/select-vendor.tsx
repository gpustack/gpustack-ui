import {
  AddWorkerDockerNotes,
  GPUDriverMap,
  GPUsConfigs
} from '@/pages/resources/config/gpu-driver';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
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

  const [selectedKeys, setSelectedKeys] = useState<string[]>([
    GPUDriverMap.NVIDIA
  ]);

  // No vendor is gated anymore — every card stays selectable.
  const availableKeys = undefined;

  // Cache vendor metadata (label/link from SupportedGPUs items) so we can
  // rebuild workerCommand on toggle without re-clicking the card.
  const itemMetaRef = useRef<Record<string, { label: string; link: string }>>(
    {}
  );

  // Push current selection into the shared summary so consumers
  // (K8sRunCommand, CheckEnvironment, VendorNotes) can read it.
  useEffect(() => {
    const primary = selectedKeys[0] || '';
    updateField('currentGPU', primary);
    updateField('selectedGPUs', selectedKeys);
    updateField(
      'workerCommand',
      primary ? buildWorkerCommand(primary, itemMetaRef.current[primary]) : null
    );
  }, [selectedKeys]);

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

  const handleSelect = (key: string, item: any) => {
    if (item) {
      itemMetaRef.current[key] = {
        label: item.label,
        link: item.link
      };
    }
    setSelectedKeys((prev) => {
      const has = prev.includes(key);
      if (has) {
        // Clicking a selected card always toggles it off.
        return prev.filter((v) => v !== key);
      }
      // K8s clusters support multiple GPU runtimes, so accumulate picks.
      // Other providers stay single-select and replace the current pick.
      if (multiCapable) return [...prev, key];
      return [key];
    });
  };

  return (
    <StepCollapse
      disabled={disabled}
      name={StepNamesMap.SelectGPU}
      title={
        <Title>
          {stepIndex}.{' '}
          {intl.formatMessage({ id: 'clusters.addworker.selectGPU' })}
          {multiCapable && (
            <Tag
              color="blue"
              style={{
                marginLeft: 8,
                fontWeight: 400,
                borderRadius: 4
              }}
            >
              {intl.formatMessage({
                id: 'clusters.addworker.selectGPU.multiTag'
              })}
            </Tag>
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
