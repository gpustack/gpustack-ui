import { IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Result } from 'antd';
import PageBox from '../_components/page-box';

// OSS-only upsell page for the billing module. The real Billing UI ships
// in the enterprise plugin and shadows this route via
// `routes.extensions.ts` — when the enterprise plugin is loaded, the
// merger removes this entry by name. So this file is what users see on
// the OSS build only.
const Billing: React.FC = () => {
  const intl = useIntl();
  const features = [
    'billing.upsell.feature.usage',
    'billing.upsell.feature.invoices',
    'billing.upsell.feature.budgets',
    'billing.upsell.feature.chargeback'
  ];
  return (
    <PageBox>
      <div
        style={{
          // Use a viewport-relative min-height so flex centering has
          // something to work against — percentage heights through
          // PageBox's wrapper chain don't always resolve. The offset
          // accounts for the global header + the page title bar.
          minHeight: 'calc(100vh - 180px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Result
          icon={
            <IconFont
              type="icon-billing-outlined"
              style={{ fontSize: 64, color: 'var(--ant-color-primary)' }}
            />
          }
          title={intl.formatMessage({ id: 'billing.upsell.title' })}
          extra={
            <div
              style={{
                maxWidth: 520,
                margin: '0 auto',
                textAlign: 'left'
              }}
            >
              {/* <Typography.Title level={5} style={{ marginBottom: 12 }}>
                {intl.formatMessage({
                  id: 'billing.upsell.featuresTitle'
                })}
              </Typography.Title>
              <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
                {features.map((id) => (
                  <li key={id} style={{ marginBottom: 6 }}>
                    {intl.formatMessage({ id })}
                  </li>
                ))}
              </ul> */}
              <div style={{ textAlign: 'center', marginTop: 56 }}>
                <Button
                  type="primary"
                  href="https://gpustack.ai/enterprise"
                  target="_blank"
                  rel="noreferrer"
                >
                  {intl.formatMessage({ id: 'billing.upsell.cta' })}
                </Button>
              </div>
            </div>
          }
        />
      </div>
    </PageBox>
  );
};

export default Billing;
