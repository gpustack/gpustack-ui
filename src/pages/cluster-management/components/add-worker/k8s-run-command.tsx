import { useIntl } from '@umijs/max';
import RegisterClusterInner from '../register-cluster-inner';
import { useAddWorkerContext } from './add-worker-context';
import { StepNamesMap } from './config';
import { Tips, Title } from './constainers';
import StepCollapse from './step-collapse';

const K8sRunCommand = () => {
  const { registrationInfo, stepList } = useAddWorkerContext();
  const intl = useIntl();

  const stepIndex = stepList.indexOf(StepNamesMap.RunCommand) + 1;

  return (
    <StepCollapse
      name={StepNamesMap.RunCommand}
      title={
        <Title>
          {stepIndex}.{' '}
          {intl.formatMessage({ id: 'clusters.addworker.runCommand' })}
        </Title>
      }
    >
      <Tips
        style={{
          marginBottom: 8,
          color: 'var(--ant-color-text)'
        }}
      >
        {intl.formatMessage({
          id: 'clusters.create.addCommand.tips'
        })}
      </Tips>
      <RegisterClusterInner registrationInfo={registrationInfo} />
    </StepCollapse>
  );
};

export default K8sRunCommand;
