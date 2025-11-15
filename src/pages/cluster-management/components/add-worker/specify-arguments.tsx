import AlertInfoBlock from '@/components/alert-info/block';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Input, Switch } from 'antd';
import { useEffect } from 'react';
import { useAddWorkerContext } from './add-worker-context';
import { StepNamesMap } from './config';
import { NotesWrapper, SwitchWrapper, Tips, Title } from './constainers';
import StepCollapse from './step-collapse';

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
    const unregister = registerField('workerIPConfig');
    return () => {
      unregister();
    };
  }, []);

  useEffect(() => {
    const unregister = registerField('modelDirConfig');
    return () => {
      unregister();
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
        <SwitchWrapper>
          <div className="button">
            <span style={{ color: 'var(--ant-color-text)', fontWeight: 500 }}>
              {workerIPConfig.enable
                ? intl.formatMessage({
                    id: 'clusters.addworker.specifyWorkerIP'
                  })
                : intl.formatMessage({
                    id: 'clusters.addworker.detectWorkerIP'
                  })}
            </span>
            <Switch
              checked={workerIPConfig.enable}
              onChange={(checked) =>
                setWorkerIPConfig({
                  ...workerIPConfig,
                  enable: checked,
                  required: false
                })
              }
            ></Switch>
          </div>
          {workerIPConfig.enable && (
            <>
              <Input
                style={{ width: '100%' }}
                placeholder={intl.formatMessage({
                  id: 'clusters.addworker.enterWorkerIP'
                })}
                value={workerIPConfig.ip}
                onChange={(e) =>
                  setWorkerIPConfig({
                    ...workerIPConfig,
                    ip: e.target.value
                  })
                }
              />
              {workerIPConfig.required && !workerIPConfig.ip && (
                <Tips
                  style={{
                    color: 'var(--ant-color-error)'
                  }}
                >
                  {intl.formatMessage({
                    id: 'clusters.addworker.enterWorkerIP.error'
                  })}
                </Tips>
              )}
            </>
          )}
          {!workerIPConfig.enable && (
            <AlertInfoBlock
              maxHeight={200}
              contentStyle={{
                paddingLeft: 0
              }}
              style={{ marginBottom: 8 }}
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
          )}
        </SwitchWrapper>
        {/* model directory config */}
        <SwitchWrapper>
          <div className="button">
            <span style={{ color: 'var(--ant-color-text)', fontWeight: 500 }}>
              {/* optional */}
              <span>
                {intl.formatMessage({ id: 'clusters.addworker.extraVolume' })}
              </span>
            </span>

            <Switch
              checked={modelDirConfig.enable}
              onChange={(checked) =>
                setModelDirConfig({ ...modelDirConfig, enable: checked })
              }
            ></Switch>
          </div>
          <Tips
            dangerouslySetInnerHTML={{
              __html: intl.formatMessage({
                id: 'clusters.addworker.nvidiaNotes-02'
              })
            }}
          ></Tips>
          {modelDirConfig.enable && (
            <Input
              style={{ width: '100%' }}
              value={modelDirConfig.path}
              placeholder={intl.formatMessage({
                id: 'clusters.addworker.extraVolume.holder'
              })}
              onChange={(e) =>
                setModelDirConfig({
                  ...modelDirConfig,
                  path: e.target.value
                })
              }
            />
          )}
        </SwitchWrapper>
      </div>
    </StepCollapse>
  );
};

export default SpecifyArguments;
