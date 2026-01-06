import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Flex, Result } from 'antd';
import React from 'react';
import { ProviderValueMap } from '../config';

const SuccessResult: React.FC<{
  provider: string;
  onSkip: () => void;
  onAddWorker: () => void;
}> = ({ provider, onSkip, onAddWorker }) => {
  const k8sTips =
    'Next, register this Kubernetes cluster. You can also skip this step and register it later from the cluster list.';
  const dockerTips = (
    <div className="flex-column">
      <span>Next, add worker to this cluster.</span>
      <span>
        You can also skip this step and add them later from the cluster list.
      </span>
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
          style={{ color: 'var(--ant-color-success)', fontSize: 42 }}
        />
      }
      status="success"
      title="Cluster Created Successfully!"
      subTitle={provider === ProviderValueMap.Kubernetes ? k8sTips : dockerTips}
      extra={[
        <Flex gap={16} justify="center" key="buttons">
          <Button key="buy" onClick={onSkip}>
            Skip for now
          </Button>
          <Button type="primary" key="console" onClick={onAddWorker}>
            {provider === ProviderValueMap.Kubernetes
              ? 'Register Cluster'
              : 'Add Worker'}
          </Button>
        </Flex>
      ]}
    />
  );
};

export default SuccessResult;
