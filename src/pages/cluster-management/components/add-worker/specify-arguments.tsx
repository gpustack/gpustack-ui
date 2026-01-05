import AlertInfoBlock from '@/components/alert-info/block';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Input, Switch, Typography } from 'antd';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useAddWorkerContext } from './add-worker-context';
import { AddWorkerStepProps, StepNamesMap } from './config';
import { NotesWrapper, SwitchWrapper, Title } from './constainers';
import StepCollapse from './step-collapse';

const ButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SwitchSetting: React.FC<{
  label: React.ReactNode;
  checked: boolean;
  value?: string;
  placeholder?: string;
  tips?: React.ReactNode;
  errorMessage?: React.ReactNode;
  extra?: React.ReactNode;
  showSwitch?: boolean;
  onInputChange?: (value: string) => void;
  onChange: (checked: boolean) => void;
}> = ({
  showSwitch = true,
  label,
  checked,
  onChange,
  value,
  placeholder,
  tips,
  extra,
  errorMessage,
  onInputChange
}) => {
  return (
    <SwitchWrapper>
      <ButtonWrapper>
        <span style={{ color: 'var(--ant-color-text)', fontWeight: 500 }}>
          <span>{label}</span>
        </span>
        {showSwitch && <Switch checked={checked} onChange={onChange}></Switch>}
      </ButtonWrapper>
      {tips && (
        <Typography.Text type="secondary">
          <div
            dangerouslySetInnerHTML={{
              __html: tips
            }}
          ></div>
        </Typography.Text>
      )}
      {checked && (
        <div>
          <Input
            style={{ width: '100%' }}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onInputChange?.(e.target.value)}
          />
          {errorMessage && (
            <Typography.Text type="danger">{errorMessage}</Typography.Text>
          )}
        </div>
      )}
      {extra}
    </SwitchWrapper>
  );
};

const SpecifyArguments: React.FC<AddWorkerStepProps> = ({ disabled }) => {
  const intl = useIntl();
  const { stepList, summary, updateField, registerField } =
    useAddWorkerContext();
  const stepIndex = stepList.indexOf(StepNamesMap.SpecifyArgs) + 1;

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
    path: ''
  };

  const cacheDirConfig = summary.get('cacheDirConfig') || {
    enable: false,
    path: ''
  };

  const containerNameConfig = summary.get('containerNameConfig') || {
    enable: true,
    name: 'gpustack-worker'
  };

  const gpustackDataVolumeConfig = summary.get('gpustackDataVolumeConfig') || {
    enable: true,
    path: 'gpustack-data'
  };

  const setWorkerIPConfig = (config: {
    enable: boolean;
    ip?: string;
    required?: boolean;
  }) => {
    updateField('workerIPConfig', {
      ...workerIPConfig,
      ...config
    });
  };

  const setModelDirConfig = (config: { enable: boolean; path?: string }) => {
    updateField('modelDirConfig', {
      ...modelDirConfig,
      ...config
    });
  };

  const setCacheDirConfig = (config: { enable: boolean; path?: string }) => {
    updateField('cacheDirConfig', {
      ...cacheDirConfig,
      ...config
    });
  };

  const beforeNext = async () => {
    if (workerIPConfig.enable && !workerIPConfig.ip) {
      setWorkerIPConfig({
        ...workerIPConfig,
        required: true
      });

      return false;
    }

    if (externalWorkerIPConfig.enable && !externalWorkerIPConfig.ip) {
      updateField('externalWorkerIPConfig', {
        ...externalWorkerIPConfig,
        required: true
      });

      return false;
    }

    return true;
  };

  useEffect(() => {
    const unregisterWorkerIP = registerField('workerIPConfig');
    const unregisterModelDir = registerField('modelDirConfig');
    const unregisterCacheDir = registerField('cacheDirConfig');
    const unregisterContainerName = registerField('containerNameConfig');
    const unregisterGpustackDataVolume = registerField(
      'gpustackDataVolumeConfig'
    );
    return () => {
      unregisterWorkerIP();
      unregisterModelDir();
      unregisterCacheDir();
      unregisterContainerName();
      unregisterGpustackDataVolume();
    };
  }, []);

  useEffect(() => {
    updateField('workerIPConfig', {
      enable: true,
      ip: '',
      required: false
    });

    updateField('modelDirConfig', {
      enable: false,
      path: ''
    });

    updateField('cacheDirConfig', {
      enable: false,
      path: ''
    });

    updateField('containerNameConfig', {
      enable: true,
      name: 'gpustack-worker'
    });

    updateField('gpustackDataVolumeConfig', {
      enable: true,
      path: 'gpustack-data'
    });

    updateField('externalWorkerIPConfig', {
      enable: false,
      ip: '',
      required: false
    });
  }, []);

  return (
    <StepCollapse
      disabled={disabled}
      beforeNext={beforeNext}
      name={StepNamesMap.SpecifyArgs}
      title={
        <Title>
          {stepIndex}.{' '}
          {intl.formatMessage({ id: 'clusters.addworker.specifyArgs' })}
        </Title>
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: 8
        }}
      >
        {/* worker IP config */}
        <SwitchSetting
          label={
            <span
              dangerouslySetInnerHTML={{
                __html: workerIPConfig.enable
                  ? intl.formatMessage({
                      id: 'clusters.addworker.specifyWorkerIP'
                    })
                  : intl.formatMessage({
                      id: 'clusters.addworker.detectWorkerIP'
                    })
              }}
            ></span>
          }
          placeholder={intl.formatMessage({
            id: 'clusters.addworker.enterWorkerIP'
          })}
          value={workerIPConfig.ip}
          checked={workerIPConfig.enable}
          errorMessage={
            workerIPConfig.required &&
            !workerIPConfig.ip &&
            intl.formatMessage({
              id: 'clusters.addworker.enterWorkerIP.error'
            })
          }
          onChange={(checked) =>
            setWorkerIPConfig({
              ...workerIPConfig,
              enable: checked,
              required: false
            })
          }
          onInputChange={(value) =>
            setWorkerIPConfig({
              ...workerIPConfig,
              ip: value
            })
          }
          extra={
            !workerIPConfig.enable && (
              <AlertInfoBlock
                maxHeight={200}
                contentStyle={{
                  paddingLeft: 0
                }}
                type="warning"
                icon={<ExclamationCircleFilled />}
                message={
                  <NotesWrapper>
                    <li
                      style={{
                        marginLeft: '0 !important',
                        listStyleType: 'none'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                          id: 'clusters.addworker.nvidiaNotes-01'
                        })
                      }}
                    ></li>
                  </NotesWrapper>
                }
              ></AlertInfoBlock>
            )
          }
        ></SwitchSetting>
        {/* external worker ip config */}
        <SwitchSetting
          label={
            <span
              dangerouslySetInnerHTML={{
                __html: externalWorkerIPConfig.enable
                  ? intl.formatMessage({
                      id: 'clusters.addworker.specifyWorkerAddress'
                    })
                  : intl.formatMessage({
                      id: 'clusters.addworker.detectWorkerAddress'
                    })
              }}
            ></span>
          }
          tips={intl.formatMessage({
            id: 'clusters.addworker.detectWorkerAddress.tips'
          })}
          placeholder={intl.formatMessage({
            id: 'clusters.addworker.enterWorkerAddress'
          })}
          value={externalWorkerIPConfig.ip}
          checked={externalWorkerIPConfig.enable}
          errorMessage={
            externalWorkerIPConfig.required &&
            !externalWorkerIPConfig.ip &&
            intl.formatMessage({
              id: 'clusters.addworker.enterWorkerAddress.error'
            })
          }
          onChange={(checked) =>
            updateField('externalWorkerIPConfig', {
              ...externalWorkerIPConfig,
              enable: checked,
              required: false
            })
          }
          onInputChange={(value) =>
            updateField('externalWorkerIPConfig', {
              ...externalWorkerIPConfig,
              ip: value
            })
          }
          extra={
            externalWorkerIPConfig.enable && (
              <AlertInfoBlock
                maxHeight={200}
                contentStyle={{
                  paddingLeft: 0
                }}
                type="warning"
                icon={<ExclamationCircleFilled />}
                message={
                  <NotesWrapper>
                    <li
                      style={{
                        marginLeft: '0 !important',
                        listStyleType: 'none'
                      }}
                    >
                      {intl.formatMessage({
                        id: 'clusters.addworker.externalIP.tips'
                      })}
                    </li>
                  </NotesWrapper>
                }
              ></AlertInfoBlock>
            )
          }
        ></SwitchSetting>
        {/* cache directory config */}
        <SwitchSetting
          label={intl.formatMessage({ id: 'clusters.addworker.cacheVolume' })}
          tips={intl.formatMessage({
            id: 'clusters.addworker.cacheVolume.tips'
          })}
          placeholder={intl.formatMessage({
            id: 'clusters.addworker.cacheVolume.holder'
          })}
          checked={cacheDirConfig.enable}
          value={cacheDirConfig.path}
          onChange={(checked) =>
            setCacheDirConfig({ ...cacheDirConfig, enable: checked })
          }
          onInputChange={(value) =>
            setCacheDirConfig({
              ...cacheDirConfig,
              path: value
            })
          }
        ></SwitchSetting>
        {/* model directory config */}
        <SwitchSetting
          label={intl.formatMessage({ id: 'clusters.addworker.extraVolume' })}
          tips={intl.formatMessage({
            id: 'clusters.addworker.nvidiaNotes-02'
          })}
          placeholder={intl.formatMessage({
            id: 'clusters.addworker.extraVolume.holder'
          })}
          checked={modelDirConfig.enable}
          value={modelDirConfig.path}
          onChange={(checked) =>
            setModelDirConfig({ ...modelDirConfig, enable: checked })
          }
          onInputChange={(value) =>
            setModelDirConfig({
              ...modelDirConfig,
              path: value
            })
          }
        ></SwitchSetting>

        {/* gpustack data volume config */}
        <SwitchSetting
          showSwitch={false}
          label={intl.formatMessage({ id: 'clusters.addworker.dataVolume' })}
          placeholder={intl.formatMessage(
            {
              id: 'common.help.default'
            },
            { content: 'gpustack-data' }
          )}
          checked={gpustackDataVolumeConfig.enable}
          value={gpustackDataVolumeConfig.path}
          onChange={(checked) =>
            updateField('gpustackDataVolumeConfig', {
              ...gpustackDataVolumeConfig,
              enable: checked
            })
          }
          onInputChange={(value) =>
            updateField('gpustackDataVolumeConfig', {
              ...gpustackDataVolumeConfig,
              path: value
            })
          }
        ></SwitchSetting>
        {/* container name config */}
        <SwitchSetting
          showSwitch={false}
          label={intl.formatMessage({ id: 'clusters.addworker.containerName' })}
          placeholder={intl.formatMessage(
            {
              id: 'common.help.default'
            },
            { content: 'gpustack-worker' }
          )}
          checked={containerNameConfig.enable}
          value={containerNameConfig.name}
          onChange={(checked) =>
            updateField('containerNameConfig', {
              ...containerNameConfig,
              enable: checked
            })
          }
          onInputChange={(value) =>
            updateField('containerNameConfig', {
              ...containerNameConfig,
              name: value
            })
          }
        ></SwitchSetting>
      </div>
    </StepCollapse>
  );
};

export default SpecifyArguments;
