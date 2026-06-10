import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert, Typography } from 'antd';
import { ProviderValueMap } from '../../config';
import CheckEnvCommand from '../check-env-command';
import { useAddWorkerContext } from './add-worker-context';
import { AddWorkerStepProps, StepNamesMap } from './config';
import { Title } from './constainers';
import StepCollapse from './step-collapse';

const CheckEnvironment: React.FC<AddWorkerStepProps> = ({ disabled }) => {
  const { stepList, summary, provider } = useAddWorkerContext();
  const intl = useIntl();
  const currentGPU = summary.get('currentGPU') as string;
  const currentGPUs: string[] = (summary.get('selectedGPUs') as string[]) || [];
  const workerCommand = summary.get('workerCommand') || {
    label: '',
    link: '',
    notes: []
  };

  const stepIndex = stepList.indexOf(StepNamesMap.CheckEnv) + 1;
  const isK8s = provider === ProviderValueMap.Kubernetes;
  const isCPUOnly = isK8s && !currentGPU && currentGPUs.length === 0;

  return (
    <StepCollapse
      disabled={disabled}
      name={StepNamesMap.CheckEnv}
      title={
        <Title>
          {stepIndex}.{' '}
          {intl.formatMessage({ id: 'clusters.addworker.checkEnv' })}
        </Title>
      }
    >
      {isCPUOnly ? (
        <Typography.Paragraph style={{ marginBottom: 8 }}>
          {intl.formatMessage({
            id: 'clusters.addworker.checkEnv.cpuOnlyTips'
          })}
        </Typography.Paragraph>
      ) : (
        <>
          <Alert
            type="info"
            showIcon
            icon={<BulbOutlined />}
            style={{
              marginBottom: 8
            }}
            title={
              <span
                dangerouslySetInnerHTML={{
                  __html: intl.formatMessage(
                    { id: 'clusters.create.addworker.tips' },
                    { label: workerCommand.label, link: workerCommand.link }
                  )
                }}
              ></span>
            }
          ></Alert>
          <Typography.Paragraph style={{ marginBottom: 8 }}>
            {intl.formatMessage({ id: 'cluster.create.checkEnv.tips' })}
          </Typography.Paragraph>
        </>
      )}
      <CheckEnvCommand
        provider={provider}
        currentGPU={currentGPU}
        currentGPUs={currentGPUs}
      />
    </StepCollapse>
  );
};

export default CheckEnvironment;
