import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
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
          id: 'clusters.create.addCommand.tips'
        })}
      </Typography.Paragraph>
      <RegisterClusterInner
        registrationInfo={registrationInfo}
        currentGPU={currentGPU}
      />
    </StepCollapse>
  );
};

export default K8sRunCommand;
