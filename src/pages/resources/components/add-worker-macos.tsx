import { useIntl } from '@umijs/max';
import { Space, Typography } from 'antd';
import React, { useMemo } from 'react';

const { Text } = Typography;

interface AddWorkerMacOSProps {
  token?: string;
  platform: {
    os: string;
    downloadurl: string;
    supportVersions: string;
  };
}

const registerWorkerSteps = [
  'resources.register.worker.step2',
  `resources.register.worker.step4`,
  'resources.register.worker.step5',
  'resources.register.worker.step6',
  `resources.register.worker.step7`
];

const AddWorkerMacOS: React.FC<AddWorkerMacOSProps> = ({ platform }) => {
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
      <h3 className="font-size-14 font-600">
        1.{' '}
        {intl.formatMessage(
          { id: 'resources.register.install.title' },
          { os: platform.os }
        )}
      </h3>
      <Typography.Paragraph type="secondary" style={{ paddingLeft: 14 }}>
        <span
          dangerouslySetInnerHTML={{
            __html: intl.formatMessage(
              { id: 'resources.register.download' },
              {
                versions: intl.formatMessage({
                  id: platform.supportVersions
                }),
                url: platform.downloadurl
              }
            )
          }}
        ></span>
      </Typography.Paragraph>
      <h3 className="font-size-14 font-600">
        2. <span dangerouslySetInnerHTML={{ __html: labels.step1 }}></span>
      </h3>
      <Typography.Paragraph style={{ paddingLeft: 14 }}>
        <div className="flex">
          <Typography.Text type="secondary">
            <span
              dangerouslySetInnerHTML={{
                __html: intl.formatMessage({
                  id: 'resources.register.worker.step1'
                })
              }}
            ></span>
          </Typography.Text>
        </div>
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
        <div className="flex">
          <Space direction="vertical">
            {registerWorkerSteps.map((step, index) => (
              <Typography.Text key={index} type="secondary">
                {index + 1}.{' '}
                <span
                  dangerouslySetInnerHTML={{
                    __html: intl.formatMessage(
                      { id: step },
                      { url: window.location.origin }
                    )
                  }}
                ></span>
              </Typography.Text>
            ))}
          </Space>
        </div>
      </Typography.Paragraph>
      <h3 className="m-b-0 m-t-10 font-size-14 font-600">4. {labels.step3}</h3>
    </div>
  );
};

export default AddWorkerMacOS;
