import {
  AddWorkerDockerNotes,
  GPUDriverMap
} from '@/pages/resources/config/gpu-driver';
import { useIntl } from '@umijs/max';
import React, { useEffect } from 'react';
import SupportedGPUs from '../support-gpus';
import { useAddWorkerContext } from './add-worker-context';
import { AddWorkerStepProps, StepNamesMap } from './config';
import { Title } from './constainers';
import StepCollapse from './step-collapse';

const SelectVendor: React.FC<AddWorkerStepProps> = ({ disabled }) => {
  const { stepList, registerField, updateField } = useAddWorkerContext();
  const intl = useIntl();

  const stepIndex = stepList.indexOf(StepNamesMap.SelectGPU) + 1;
  const [currentGPU, setCurrentGPU] = React.useState<string>(
    GPUDriverMap.NVIDIA
  );

  const handleSelectProvider = (value: string, item: any) => {
    if (value === currentGPU) return;
    setCurrentGPU(value);

    updateField('currentGPU', value);
    updateField('workerCommand', item);
  };

  useEffect(() => {
    const unregisterField = registerField('currentGPU');
    return () => {
      unregisterField();
    };
  }, []);

  useEffect(() => {
    const unregisterField = registerField('workerCommand');
    return () => {
      unregisterField();
    };
  }, []);

  useEffect(() => {
    updateField('currentGPU', GPUDriverMap.NVIDIA);
    updateField('workerCommand', {
      label: 'NVIDIA',
      link: 'https://docs.gpustack.ai/latest/installation/requirements/#nvidia-gpu',
      notes: AddWorkerDockerNotes[GPUDriverMap.NVIDIA]
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
        </Title>
      }
    >
      <SupportedGPUs
        onSelect={handleSelectProvider}
        current={currentGPU}
        clickable={true}
      />
    </StepCollapse>
  );
};

export default SelectVendor;
