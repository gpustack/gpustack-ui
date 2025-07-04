import { useIntl } from '@umijs/max';
import { Space, Typography } from 'antd';
import React, { useMemo } from 'react';

interface AddWorkerMacOSProps {
  token?: string;
}

const registerWorkerSteps = [
  'Open the quick configuration file.',
  `Select the "General" option.`,
  `Select "Worker" as the service role.`,
  'Enter the Server URL.',
  'Paste the Token.',
  `Click "Restart".`
];

const AddWorkerMacOS: React.FC<AddWorkerMacOSProps> = () => {
  const intl = useIntl();
  const labels = useMemo(
    () => ({
      step1: intl.formatMessage({ id: 'resources.worker.add.step1' }),
      step2: intl.formatMessage({ id: 'resources.worker.add.step2' }),
      step2Tips: intl.formatMessage({ id: 'resources.worker.add.step2.tips' }),
      step3: intl.formatMessage({ id: 'resources.worker.add.step3' }),
      linuxOrMac: intl.formatMessage({ id: 'resources.worker.linuxormaxos' })
    }),
    [intl]
  );
  return (
    <div className="script-install">
      <h3 className="font-size-14 font-600">1. Install GPUStack</h3>
      <Typography.Paragraph type="secondary" style={{ paddingLeft: 14 }}>
        <Typography.Link>Download Package</Typography.Link> and install it on
        your macOS machine.
      </Typography.Paragraph>
      <h3 className="font-size-14 font-600">
        2. <span dangerouslySetInnerHTML={{ __html: labels.step1 }}></span>
      </h3>
      <Typography.Paragraph style={{ paddingLeft: 14 }}>
        <Typography.Text type="secondary">
          Click <span className="font-600">Copy the token</span>
        </Typography.Text>
      </Typography.Paragraph>
      <h3 className="m-t-10 font-size-14 font-600">
        3. {labels.step2}{' '}
        <span
          className="font-size-12"
          style={{ color: 'var(--ant-color-text-tertiary)' }}
          dangerouslySetInnerHTML={{
            __html: `${labels.step2Tips}`
          }}
        ></span>
      </h3>
      <Typography.Paragraph style={{ paddingLeft: 14 }}>
        <Space direction="vertical">
          {registerWorkerSteps.map((step, index) => (
            <Typography.Text key={index} type="secondary">
              {index + 1}. {step}
            </Typography.Text>
          ))}
        </Space>
      </Typography.Paragraph>
      <h3 className="m-b-0 m-t-10 font-size-14 font-600">4. {labels.step3}</h3>
    </div>
  );
};

export default AddWorkerMacOS;
