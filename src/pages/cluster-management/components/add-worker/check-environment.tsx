import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert, Typography } from 'antd';
import CheckEnvCommand from '../check-env-command';
import { useAddWorkerContext } from './add-worker-context';
import { AddWorkerStepProps, StepNamesMap } from './config';
import { Title } from './constainers';
import StepCollapse from './step-collapse';

const CheckEnvironment: React.FC<AddWorkerStepProps> = ({ disabled }) => {
  const { stepList, summary, provider } = useAddWorkerContext();
  const intl = useIntl();
  const currentGPU = summary.get('currentGPU');
  const workerCommand = summary.get('workerCommand') || {
    label: '',
    link: '',
    notes: []
  };

  const stepIndex = stepList.indexOf(StepNamesMap.CheckEnv) + 1;

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
      <CheckEnvCommand provider={provider} currentGPU={currentGPU} />
    </StepCollapse>
  );
};

export default CheckEnvironment;
