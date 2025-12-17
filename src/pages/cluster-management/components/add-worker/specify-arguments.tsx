import AlertInfoBlock from '@/components/alert-info/block';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Input, Switch } from 'antd';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useAddWorkerContext } from './add-worker-context';
import { StepNamesMap } from './config';
import { NotesWrapper, SwitchWrapper, Tips, Title } from './constainers';
import StepCollapse from './step-collapse';

const ButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SwitchSetting: React.FC<{
  label: string;
  checked: boolean;
  value?: string;
  placeholder?: string;
  tips?: React.ReactNode;
  errorMessage?: React.ReactNode;
  extra?: React.ReactNode;
  onInputChange?: (value: string) => void;
  onChange: (checked: boolean) => void;
}> = ({
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
        <Switch checked={checked} onChange={onChange}></Switch>
      </ButtonWrapper>
      {tips && (
        <Tips
          dangerouslySetInnerHTML={{
            __html: tips
          }}
        ></Tips>
      )}
      {checked && (
        <>
          <Input
            style={{ width: '100%' }}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onInputChange?.(e.target.value)}
          />
          {errorMessage && (
            <Tips
              style={{
                color: 'var(--ant-color-error)'
              }}
            >
              {errorMessage}
            </Tips>
          )}
        </>
      )}
      {extra}
    </SwitchWrapper>
  );
};

const SpecifyArguments = () => {
  const intl = useIntl();
  const { stepList, summary, updateField, registerField } =
    useAddWorkerContext();
  const stepIndex = stepList.indexOf(StepNamesMap.SpecifyArgs) + 1;

  const workerIPConfig = summary.get('workerIPConfig') || {
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
    enable: false,
    name: ''
  };

  const gpustackDataVolumeConfig = summary.get('gpustackDataVolumeConfig') || {
    enable: false,
    path: ''
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
      enable: false,
      name: ''
    });

    updateField('gpustackDataVolumeConfig', {
      enable: false,
      path: ''
    });
  }, []);

  return (
    <StepCollapse
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
            workerIPConfig.enable
              ? intl.formatMessage({
                  id: 'clusters.addworker.specifyWorkerIP'
                })
              : intl.formatMessage({
                  id: 'clusters.addworker.detectWorkerIP'
                })
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
        {/* container name config */}
        <SwitchSetting
          label={intl.formatMessage({ id: 'clusters.addworker.containerName' })}
          tips={intl.formatMessage({
            id: 'clusters.addworker.containerName.tips'
          })}
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
        {/* gpustack data volume config */}
        <SwitchSetting
          label={intl.formatMessage({ id: 'clusters.addworker.dataVolume' })}
          tips={intl.formatMessage({
            id: 'clusters.addworker.dataVolume.tips'
          })}
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
      </div>
    </StepCollapse>
  );
};

export default SpecifyArguments;
