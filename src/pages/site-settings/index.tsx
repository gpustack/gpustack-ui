import PageBox from '@/pages/_components/page-box';
import { useCoreUIContext, useSubmitLock } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Typography,
  message
} from 'antd';
import { useState } from 'react';
import { applySiteSettings } from './bootstrap';
import AssetInput from './components/asset-input';
import { defaultSiteSettings } from './config';
import type { FormData } from './config/types';
import { querySiteSettings, updateSiteSettings } from './services/api';
import styles from './styles.module.less';

export default function SiteSettings() {
  const intl = useIntl();
  const [form] = Form.useForm<FormData>();
  const {
    services: { request }
  } = useCoreUIContext();
  const query = useRequest(() => querySiteSettings(request), {
    onSuccess: (settings) => form.setFieldsValue(settings)
  });
  const { loading: saving, guard, run, release } = useSubmitLock();
  const [readingAssets, setReadingAssets] = useState(0);
  const handleReading = (reading: boolean) =>
    setReadingAssets((count) => count + (reading ? 1 : -1));
  const primaryColor = Form.useWatch('primary_color', form);
  const [messageApi, messageHolder] = message.useMessage();

  const handleSubmit = async (values: FormData) => {
    if (!query.data || query.error || readingAssets) {
      release();
      return;
    }
    await run(async () => {
      try {
        const next = await updateSiteSettings(request, values);
        applySiteSettings(next);
        messageApi.success(
          intl.formatMessage({ id: 'siteSettings.saveSuccess' })
        );
      } catch {
        messageApi.error(intl.formatMessage({ id: 'siteSettings.saveError' }));
      }
    });
  };

  return (
    <PageBox>
      {messageHolder}
      <Flex vertical gap="large" className={styles.page}>
        {query.error && (
          <Alert
            type="error"
            showIcon
            title={intl.formatMessage({ id: 'siteSettings.loadError' })}
            action={
              <Button onClick={() => void query.run()}>
                {intl.formatMessage({ id: 'siteSettings.retry' })}
              </Button>
            }
          />
        )}
        <Form
          form={form}
          layout="vertical"
          initialValues={defaultSiteSettings}
          onFinish={handleSubmit}
          onFinishFailed={release}
          disabled={saving || query.loading || !!query.error || !query.data}
        >
          <Flex vertical gap="large">
            <Card
              className={styles.basicCard}
              title={intl.formatMessage({ id: 'siteSettings.basicInfo' })}
              loading={query.loading && !query.data}
            >
              <Form.Item
                name="site_name"
                label={intl.formatMessage({ id: 'siteSettings.siteName' })}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: intl.formatMessage({
                      id: 'siteSettings.siteNameRequired'
                    })
                  }
                ]}
              >
                <Input
                  maxLength={128}
                  placeholder={defaultSiteSettings.site_name}
                />
              </Form.Item>
              <Form.Item
                label={intl.formatMessage({ id: 'siteSettings.primaryColor' })}
                extra={defaultSiteSettings.primary_color}
              >
                <Flex align="center" gap="small">
                  <Form.Item
                    name="primary_color"
                    noStyle
                    rules={[
                      {
                        required: true,
                        pattern: /^#[0-9a-fA-F]{6}$/,
                        message: intl.formatMessage({
                          id: 'siteSettings.colorInvalid'
                        })
                      }
                    ]}
                  >
                    <Input
                      type="color"
                      style={{ width: 64, padding: 2 }}
                      aria-label={intl.formatMessage({
                        id: 'siteSettings.primaryColor'
                      })}
                    />
                  </Form.Item>
                  <Button
                    type="link"
                    size="small"
                    disabled={
                      primaryColor === defaultSiteSettings.primary_color
                    }
                    onClick={() =>
                      form.setFieldValue(
                        'primary_color',
                        defaultSiteSettings.primary_color
                      )
                    }
                  >
                    {intl.formatMessage({ id: 'siteSettings.resetDefault' })}
                  </Button>
                </Flex>
              </Form.Item>
            </Card>
            <Card
              title={intl.formatMessage({ id: 'siteSettings.brandAssets' })}
              loading={query.loading && !query.data}
            >
              <Typography.Text type="secondary" className={styles.assetHint}>
                {intl.formatMessage({ id: 'siteSettings.assetHint' })}
              </Typography.Text>
              <Form.Item
                name="logo"
                label={intl.formatMessage({ id: 'siteSettings.logo' })}
                className={styles.assetField}
              >
                <AssetInput
                  label={intl.formatMessage({ id: 'siteSettings.logo' })}
                  onReading={handleReading}
                />
              </Form.Item>
              <Form.Item
                name="logo_dark"
                label={intl.formatMessage({ id: 'siteSettings.logoDark' })}
                className={styles.assetField}
              >
                <AssetInput
                  label={intl.formatMessage({ id: 'siteSettings.logoDark' })}
                  onReading={handleReading}
                />
              </Form.Item>
              <Form.Item
                name="mini_logo"
                label={intl.formatMessage({ id: 'siteSettings.miniLogo' })}
                className={styles.assetField}
              >
                <AssetInput
                  label={intl.formatMessage({ id: 'siteSettings.miniLogo' })}
                  onReading={handleReading}
                />
              </Form.Item>
              <Form.Item
                name="mini_logo_dark"
                label={intl.formatMessage({ id: 'siteSettings.miniLogoDark' })}
                className={styles.assetField}
              >
                <AssetInput
                  label={intl.formatMessage({
                    id: 'siteSettings.miniLogoDark'
                  })}
                  onReading={handleReading}
                />
              </Form.Item>
              <Form.Item
                name="favicon"
                label={intl.formatMessage({ id: 'siteSettings.favicon' })}
                className={styles.assetField}
              >
                <AssetInput
                  label={intl.formatMessage({ id: 'siteSettings.favicon' })}
                  onReading={handleReading}
                />
              </Form.Item>
            </Card>
            <Card
              title={intl.formatMessage({ id: 'siteSettings.footerInfo' })}
              loading={query.loading && !query.data}
            >
              <Form.Item
                name="footer_name"
                label={intl.formatMessage({ id: 'siteSettings.footerName' })}
              >
                <Input
                  maxLength={128}
                  placeholder={intl.formatMessage({ id: 'settings.company' })}
                />
              </Form.Item>
              <Form.Item
                name="footer_url"
                label={intl.formatMessage({ id: 'siteSettings.footerUrl' })}
              >
                <Input maxLength={2048} placeholder="https://gpustack.ai" />
              </Form.Item>
            </Card>
            <Flex justify="flex-end">
              <Button
                type="primary"
                onClick={() => guard(() => form.submit())}
                loading={saving}
                disabled={
                  !query.data ||
                  query.loading ||
                  !!query.error ||
                  readingAssets > 0
                }
              >
                {intl.formatMessage({ id: 'siteSettings.save' })}
              </Button>
            </Flex>
          </Flex>
        </Form>
      </Flex>
    </PageBox>
  );
}
