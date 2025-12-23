import {
  CheckCircleOutlined,
  StopOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import React from 'react';
import styled from 'styled-components';
import { useAddWorkerContext } from './add-worker-context';
import { StepNamesMap } from './config';
import { ConfigWrapper, Title } from './constainers';

interface DataItemProps {
  enable: boolean;
  value: string;
  required?: boolean;
  label: React.ReactNode;
  tips?: string;
}

const DataItemWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  .label {
    color: var(--ant-color-text);
  }
  .value {
    display: flex;
    align-items: center;
  }
`;

const DataItem: React.FC<DataItemProps> = ({
  enable,
  value,
  required,
  label,
  tips
}) => {
  return (
    <DataItemWrapper>
      <span className="label">{label}:</span>
      <span className="value">
        <span>{enable && value ? value : ''}</span>
        {tips}
        {(!value || !enable) && !required && (
          <StopOutlined
            style={{
              color: 'var(--ant-color-text-tertiary)'
            }}
          />
        )}

        {((enable && value) || (required && !enable)) && (
          <CheckCircleOutlined
            style={{
              color: 'var(--ant-color-success)',
              marginLeft: 4
            }}
          />
        )}

        {enable && !value && required && (
          <>
            <WarningOutlined
              style={{
                color: 'var(--ant-color-warning)',
                marginLeft: 4
              }}
            />
          </>
        )}
      </span>
    </DataItemWrapper>
  );
};

const SummaryData: React.FC = () => {
  const intl = useIntl();
  const { summary, stepList } = useAddWorkerContext();
  const clusterName = summary.get('clusterName') || '';
  const workerCommand = summary.get('workerCommand') || {
    label: '',
    link: '',
    notes: []
  };
  const workerIPConfig = summary.get('workerIPConfig') || {
    enable: false,
    ip: ''
  };
  const modelDirConfig = summary.get('modelDirConfig') || {
    enable: false,
    path: ''
  };

  const cacheDirConfig = summary.get('cacheDirConfig') || {
    enable: false,
    path: ''
  };

  const externalWorkerIPConfig = summary.get('externalWorkerIPConfig') || {
    enable: false,
    ip: ''
  };

  return (
    <ConfigWrapper>
      <Title>
        {intl.formatMessage({ id: 'clusters.addworker.configSummary' })}
      </Title>
      <div className="config-content">
        {stepList.includes(StepNamesMap.SelectCluster) && (
          <DataItem
            value={clusterName}
            enable={true}
            label={intl.formatMessage({ id: 'clusters.title' })}
          ></DataItem>
        )}

        <DataItem
          label={intl.formatMessage({ id: 'clusters.addworker.gpuVendor' })}
          enable={true}
          value={workerCommand.label}
        ></DataItem>

        <DataItem
          label={
            <span>
              {intl.formatMessage({
                id: 'clusters.addworker.workerIP'
              })}
            </span>
          }
          tips={
            workerIPConfig.enable
              ? workerIPConfig.ip
                ? ''
                : intl.formatMessage({ id: 'clusters.addworker.notSpecified' })
              : intl.formatMessage({ id: 'clusters.addworker.autoDetect' })
          }
          enable={workerIPConfig.enable}
          value={workerIPConfig.ip}
          required={true}
        ></DataItem>

        <DataItem
          label={
            <span>
              {intl.formatMessage({
                id: 'clusters.addworker.workerExternalIP'
              })}
            </span>
          }
          tips={
            externalWorkerIPConfig.enable
              ? externalWorkerIPConfig.ip
                ? ''
                : intl.formatMessage({ id: 'clusters.addworker.notSpecified' })
              : intl.formatMessage({ id: 'clusters.addworker.autoDetect' })
          }
          enable={externalWorkerIPConfig.enable}
          value={externalWorkerIPConfig.ip}
          required={true}
        ></DataItem>

        <DataItem
          label={intl.formatMessage({ id: 'clusters.addworker.extraVolume' })}
          enable={modelDirConfig.enable}
          value={modelDirConfig.path}
        ></DataItem>

        <DataItem
          label={intl.formatMessage({ id: 'clusters.addworker.cacheVolume' })}
          enable={cacheDirConfig.enable}
          value={cacheDirConfig.path}
        ></DataItem>
      </div>
    </ConfigWrapper>
  );
};

export default SummaryData;
