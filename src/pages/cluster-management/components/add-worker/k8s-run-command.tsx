import { ExclamationCircleFilled } from '@ant-design/icons';
import { AlertBlockInfo } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import { isNoWorkerSelection } from '../../config';
import RegisterClusterInner from '../register-cluster-inner';
import { useAddWorkerContext } from './add-worker-context';
import { AddWorkerStepProps, StepNamesMap } from './config';
import { Title } from './constainers';
import StepCollapse from './step-collapse';

const K8sRunCommand: React.FC<AddWorkerStepProps> = ({ disabled }) => {
  const { registrationInfo, stepList, summary } = useAddWorkerContext();
  const intl = useIntl();

  const stepIndex = stepList.indexOf(StepNamesMap.RunCommand) + 1;
  const currentGPU = summary.get('currentGPU') || '';
  const currentGPUs: string[] = summary.get('selectedGPUs') || [];
  // Set by the CPU Node card in the hardware step; `true` means the card was
  // left unselected.
  const disableCpuWorker = summary.get('disableCpuWorker') === true;
  // Dropping the CPU worker with no GPU runtime selected would install a
  // release with no worker at all — the backend answers 422. Block the copy
  // here rather than letting the user find out from a failed curl; the reason
  // is stated in the hardware step, next to the cards that decide it.
  const selectedGPUs =
    currentGPUs.length > 0 ? currentGPUs : currentGPU ? [currentGPU] : [];
  const noWorkerSelected = isNoWorkerSelection({
    disableCpuWorker,
    selectedGPUs
  });

  return (
    <StepCollapse
      disabled={disabled}
      name={StepNamesMap.RunCommand}
      title={
        <Title>
          {stepIndex}.{' '}
          {intl.formatMessage({ id: 'clusters.addworker.runCommand' })}
        </Title>
      }
    >
      <Typography.Paragraph
        style={{
          marginBottom: 8
        }}
      >
        {intl.formatMessage({
          id: 'clusters.create.addCommand.k8s.tips'
        })}
      </Typography.Paragraph>
      <AlertBlockInfo
        type="warning"
        style={{ marginBottom: 8 }}
        icon={<ExclamationCircleFilled />}
        message={intl.formatMessage({
          id: 'clusters.create.addCommand.k8s.version.warning'
        })}
      ></AlertBlockInfo>
      <RegisterClusterInner
        registrationInfo={registrationInfo}
        currentGPU={currentGPU}
        currentGPUs={currentGPUs}
        disableCpuWorker={disableCpuWorker}
        copyable={!noWorkerSelected}
      />
    </StepCollapse>
  );
};

export default K8sRunCommand;
