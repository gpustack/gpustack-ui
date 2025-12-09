import {
  CheckCircleOutlined,
  StopOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import React from 'react';
import { useAddWorkerContext } from './add-worker-context';
import { StepNamesMap } from './config';
import { ConfigWrapper, Title } from './constainers';

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

  return (
    <ConfigWrapper>
      <Title>
        {intl.formatMessage({ id: 'clusters.addworker.configSummary' })}
      </Title>
      <div className="config-content">
        {stepList.includes(StepNamesMap.SelectCluster) && (
          <div className="item">
            <span className="label">
              {intl.formatMessage({ id: 'clusters.title' })}:
            </span>
            <span className="value">
              {clusterName}
              {clusterName ? (
                <CheckCircleOutlined
                  style={{
                    color: 'var(--ant-color-success)',
                    marginLeft: 4
                  }}
                />
              ) : (
                <WarningOutlined
                  style={{
                    color: 'var(--ant-color-warning)',
                    marginLeft: 4
                  }}
                />
              )}
            </span>
          </div>
        )}
        <div className="item">
          <span className="label">
            {intl.formatMessage({ id: 'clusters.addworker.gpuVendor' })}:
          </span>
          <span className="value">
            {/* for checked style */}
            {workerCommand.label}
            <CheckCircleOutlined
              style={{
                color: 'var(--ant-color-success)',
                marginLeft: 4
              }}
            />
          </span>
        </div>
        <div className="item">
          <span className="label">
            {intl.formatMessage({ id: 'clusters.addworker.workerIP' })}:
          </span>
          <span className="value">
            {/* for invalidate style */}
            {workerIPConfig.enable
              ? workerIPConfig.ip
                ? workerIPConfig.ip
                : intl.formatMessage({ id: 'clusters.addworker.notSpecified' })
              : intl.formatMessage({ id: 'clusters.addworker.autoDetect' })}

            {workerIPConfig.enable && !workerIPConfig.ip && (
              <WarningOutlined
                style={{
                  color: 'var(--ant-color-warning)',
                  marginLeft: 4
                }}
              />
            )}
            {(!workerIPConfig.enable || workerIPConfig.ip) && (
              <CheckCircleOutlined
                style={{
                  color: 'var(--ant-color-success)',
                  marginLeft: 4
                }}
              />
            )}
          </span>
        </div>
        <div className="item">
          <span className="label">
            {intl.formatMessage({ id: 'clusters.addworker.extraVolume' })}:
          </span>
          <span className="value">
            {modelDirConfig.enable && modelDirConfig.path
              ? modelDirConfig.path
              : ''}
            {(!modelDirConfig.path || !modelDirConfig.enable) && (
              <StopOutlined
                style={{
                  color: 'var(--ant-color-text-tertiary)'
                }}
              />
            )}

            {modelDirConfig.enable && modelDirConfig.path && (
              <CheckCircleOutlined
                style={{
                  color: 'var(--ant-color-success)',
                  marginLeft: 4
                }}
              />
            )}
          </span>
        </div>
        <div className="item">
          <span className="label">
            {intl.formatMessage({ id: 'clusters.addworker.cacheVolume' })}:
          </span>
          <span className="value">
            {cacheDirConfig.enable && cacheDirConfig.path
              ? cacheDirConfig.path
              : ''}
            {(!cacheDirConfig.path || !cacheDirConfig.enable) && (
              <StopOutlined
                style={{
                  color: 'var(--ant-color-text-tertiary)'
                }}
              />
            )}

            {cacheDirConfig.enable && cacheDirConfig.path && (
              <CheckCircleOutlined
                style={{
                  color: 'var(--ant-color-success)',
                  marginLeft: 4
                }}
              />
            )}
          </span>
        </div>
      </div>
    </ConfigWrapper>
  );
};

export default SummaryData;
