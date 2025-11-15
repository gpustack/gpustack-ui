import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import CheckEnvCommand from '../check-env-command';
import { useAddWorkerContext } from './add-worker-context';
import { StepNamesMap } from './config';
import { Tips, Title } from './constainers';
import StepCollapse from './step-collapse';

const CheckEnvironment = () => {
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
        message={
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
      <Tips style={{ marginBottom: 8, color: 'var(--ant-color-text)' }}>
        {intl.formatMessage({ id: 'cluster.create.checkEnv.tips' })}
      </Tips>
      <CheckEnvCommand provider={provider} currentGPU={currentGPU} />
    </StepCollapse>
  );
};

export default CheckEnvironment;
