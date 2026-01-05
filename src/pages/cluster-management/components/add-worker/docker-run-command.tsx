import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import AddWorkerCommand from '../add-worker-command';
import { useAddWorkerContext } from './add-worker-context';
import { AddWorkerStepProps, StepNamesMap } from './config';
import { Title } from './constainers';
import StepCollapse from './step-collapse';
import SummaryData from './summary-data';
import VendorNotes from './vendor-notes';

const DockerRunCommand: React.FC<AddWorkerStepProps> = ({ disabled }) => {
  const intl = useIntl();
  const { registrationInfo, stepList, summary } = useAddWorkerContext();
  const workerIPConfig = summary.get('workerIPConfig') || {
    enable: false,
    ip: '',
    required: false
  };
  const externalWorkerIPConfig = summary.get('externalWorkerIPConfig') || {
    enable: false,
    ip: '',
    required: false
  };
  const modelDirConfig = summary.get('modelDirConfig') || {
    enable: false,
    path: '',
    required: false
  };
  const cacheDirConfig = summary.get('cacheDirConfig') || {
    enable: false,
    path: ''
  };
  const containerNameConfig = summary.get('containerNameConfig') || {
    enable: false,
    name: ''
  };
  const gpustackDataVolumeConfig = summary.get('gpustackDataVolumeConfig') || {
    enable: false,
    path: ''
  };

  const currentGPU = summary.get('currentGPU') || '';

  const stepIndex = stepList.indexOf(StepNamesMap.RunCommand) + 1;

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
      <SummaryData></SummaryData>
      <VendorNotes></VendorNotes>
      <Typography.Paragraph
        style={{
          marginBottom: 8
        }}
      >
        {intl.formatMessage({
          id: 'clusters.create.addCommand.tips'
        })}
      </Typography.Paragraph>
      <AddWorkerCommand
        registrationInfo={registrationInfo}
        advertisAddress={
          externalWorkerIPConfig.enable ? externalWorkerIPConfig.ip : ''
        }
        workerIP={workerIPConfig.enable ? workerIPConfig.ip : ''}
        modelDir={modelDirConfig.enable ? modelDirConfig.path : ''}
        cacheDir={cacheDirConfig.enable ? cacheDirConfig.path : ''}
        containerName={
          containerNameConfig.enable ? containerNameConfig.name : ''
        }
        gpustackDataVolume={
          gpustackDataVolumeConfig.enable ? gpustackDataVolumeConfig.path : ''
        }
        currentGPU={currentGPU}
      />
    </StepCollapse>
  );
};

export default DockerRunCommand;
