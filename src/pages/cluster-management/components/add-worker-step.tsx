import AlertInfoBlock from '@/components/alert-info/block';
import {
  AddWorkerDockerNotes,
  GPUDriverMap
} from '@/pages/resources/config/gpu-driver';
import { BulbOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { ProviderType, ProviderValueMap } from '../config';
import AddWorkerCommand from './add-worker-command';
import CheckEnvCommand from './check-env-command';
import RegisterClusterInner from './register-cluster-inner';
import SupportedGPUs from './support-gpus';

const StyledTag = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`;

const NotesWrapper = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 400;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1.2;
  li {
    margin-left: 12px !important;
  }
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const Line = styled.div`
  position: relative;
  margin: 24px 0;
  width: 100%;
  border-top: 1px solid var(--ant-color-border);
  &::before {
    content: '';
    position: absolute;
    top: -9px;
    left: 24px;
    width: 16px;
    height: 16px;
    transform: rotate(45deg);
    background-color: var(--ant-color-bg-elevated);
    border-top: 1px solid var(--ant-color-border);
    border-left: 1px solid var(--ant-color-border);
  }
`;

const Container = styled.div`
  width: 800px;
  margin: 0 auto;
  .command-info {
    margin-top: 24px;
    margin-bottom: 8px;
  }
`;

const Content = styled.div`
  margin-top: 24px;
  margin-bottom: 16px;
`;

type AddModalProps = {
  provider: ProviderType;
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
    cluster_id: number;
  };
};
const AddWorkerStep: React.FC<AddModalProps> = ({
  provider,
  registrationInfo
}) => {
  const intl = useIntl();
  const [currentGPU, setCurrentGPU] = React.useState<string>(
    GPUDriverMap.NVIDIA
  );
  React.useState<string>(GPUDriverMap.NVIDIA);
  const [workerCommand, setWorkerCommand] = React.useState<Record<string, any>>(
    {
      label: 'NVIDIA',
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#nvidia-cuda',
      notes: AddWorkerDockerNotes[GPUDriverMap.NVIDIA]
    }
  );

  const handleSelectProvider = (value: string, item: any) => {
    console.log('selected gpu driver:', value, item);
    setCurrentGPU(value);
    setWorkerCommand(item);
  };

  return (
    <Container>
      <Title>
        {intl.formatMessage({ id: 'clusters.create.supportedGpu' })}
      </Title>
      <SupportedGPUs
        onSelect={handleSelectProvider}
        current={currentGPU}
        clickable={true}
      />

      <Content>
        <Line></Line>
        <Alert
          type="info"
          showIcon
          icon={<BulbOutlined />}
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
      </Content>

      <div className="command-info">
        <StyledTag>1.</StyledTag>
        {intl.formatMessage({ id: 'cluster.create.checkEnv.tips' })}
      </div>
      <CheckEnvCommand provider={provider} currentGPU={currentGPU} />

      {provider === ProviderValueMap.Kubernetes ? (
        <>
          <div className="command-info">
            <StyledTag>2.</StyledTag>
            {intl.formatMessage({ id: 'clusters.create.register.tips' })}
          </div>
          <RegisterClusterInner registrationInfo={registrationInfo} />
        </>
      ) : (
        <>
          <div className="command-info">
            <StyledTag>2.</StyledTag>
            {intl.formatMessage({ id: 'clusters.create.addCommand.tips' })}
          </div>
          <AlertInfoBlock
            style={{ marginBottom: 8 }}
            type="warning"
            icon={<ExclamationCircleFilled />}
            message={
              workerCommand.notes?.length > 0 ? (
                <NotesWrapper>
                  {workerCommand.notes.map((note: string, index: number) => (
                    <li
                      key={index}
                      dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({ id: note })
                      }}
                    ></li>
                  ))}
                </NotesWrapper>
              ) : null
            }
          ></AlertInfoBlock>
          <AddWorkerCommand
            registrationInfo={registrationInfo}
            currentGPU={currentGPU}
          />
        </>
      )}
    </Container>
  );
};

export default AddWorkerStep;
