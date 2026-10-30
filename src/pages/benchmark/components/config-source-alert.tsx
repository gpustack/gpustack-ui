import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React from 'react';
import { useDetailContext } from '../config/detail-context';

const ConfigSourceAlert: React.FC = () => {
  const intl = useIntl();
  const { detailData } = useDetailContext();
  const instances = Object.values(detailData?.snapshot?.instances || {})
    .filter((member) => member.config_source === 'current_model')
    .map((member) => member.name);

  if (!instances.length) return null;

  return (
    <Alert
      type="warning"
      showIcon
      title={intl.formatMessage({
        id: 'benchmark.detail.configSource.fallback.title'
      })}
      description={intl.formatMessage(
        { id: 'benchmark.detail.configSource.fallback.description' },
        { instances: instances.join(', ') }
      )}
    />
  );
};

export default ConfigSourceAlert;
