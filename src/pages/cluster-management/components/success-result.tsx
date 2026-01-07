import { CheckCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Flex, Result } from 'antd';
import React from 'react';
import { ProviderValueMap } from '../config';

const SuccessResult: React.FC<{
  provider: string;
  onSkip: () => void;
  onAddWorker: () => void;
}> = ({ provider, onSkip, onAddWorker }) => {
  const intl = useIntl();

  const k8sTips = (
    <div className="flex-column">
      <span>{intl.formatMessage({ id: 'clusters.create.k8sTips1' })}</span>
      <span>{intl.formatMessage({ id: 'clusters.create.k8sTips2' })}</span>
    </div>
  );

  const dockerTips = (
    <div className="flex-column">
      <span>{intl.formatMessage({ id: 'clusters.create.dockerTips1' })}</span>
      <span>{intl.formatMessage({ id: 'clusters.create.dockerTips2' })}</span>
    </div>
  );

  return (
    <Result
      styles={{
        title: {
          fontSize: 16,
          fontWeight: 500
        }
      }}
      icon={
        <CheckCircleFilled
          style={{ color: 'var(--ant-color-success)', fontSize: 36 }}
        />
      }
      status="success"
      title={intl.formatMessage({ id: 'clusters.create.steps.complete.tips' })}
      subTitle={provider === ProviderValueMap.Kubernetes ? k8sTips : dockerTips}
      extra={[
        <Flex gap={16} justify="center" key="buttons">
          <Button key="skip" onClick={onSkip}>
            {intl.formatMessage({ id: 'clusters.create.skipfornow' })}
          </Button>
          <Button type="primary" key="add" onClick={onAddWorker}>
            {provider === ProviderValueMap.Kubernetes
              ? intl.formatMessage({ id: 'clusters.button.register' })
              : intl.formatMessage({ id: 'resources.button.create' })}
          </Button>
        </Flex>
      ]}
    />
  );
};

export default SuccessResult;
