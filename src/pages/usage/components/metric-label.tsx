import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import React from 'react';

/**
 * KPI card caption with a trailing help icon. The metering metrics
 * (GPU-Hours vs Instance-Hours, GB-Days vs GB-Hours) aren't self-evident, so
 * each label carries a one-line explanation behind the standard question-mark.
 */
const MetricLabel: React.FC<{
  text: string;
  tooltip: React.ReactNode;
}> = ({ text, tooltip }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
    {text}
    <Tooltip title={tooltip} styles={{ root: { maxWidth: 320 } }}>
      <QuestionCircleOutlined
        className="m-l-5"
        style={{ cursor: 'help', opacity: 0.6 }}
      />
    </Tooltip>
  </span>
);

export default MetricLabel;
