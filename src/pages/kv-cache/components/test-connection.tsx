import { useIntl } from '@umijs/max';
import { Alert, Button, Form } from 'antd';
import { useState } from 'react';
import { testCacheServiceConnection } from '../apis';
import { FormData } from '../config/types';

const TestConnection: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleTestConnection = async () => {
    let values: FormData;
    try {
      values = await form.validateFields([
        'provider_name',
        'provider_version',
        ['endpoint', 'host'],
        ['endpoint', 'port']
      ]);
    } catch (error) {
      // validation errors are rendered by the form items
      return;
    }
    try {
      setLoading(true);
      setResult(null);
      const res = await testCacheServiceConnection({
        data: {
          provider_name: values.provider_name,
          provider_version: values.provider_version,
          endpoint: {
            host: values.endpoint!.host,
            port: values.endpoint!.port
          }
        }
      });
      if (res.reachable) {
        setResult({
          type: 'success',
          // the server message carries detail such as node coverage
          message:
            res.message || intl.formatMessage({ id: 'kvCache.test.success' })
        });
      } else {
        setResult({
          type: 'error',
          message:
            res.message || intl.formatMessage({ id: 'kvCache.test.fail' })
        });
      }
    } catch (error: any) {
      setResult({
        type: 'error',
        message:
          error?.response?.data?.message ||
          intl.formatMessage({ id: 'kvCache.test.fail' })
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <Button onClick={handleTestConnection} loading={loading}>
        {intl.formatMessage({ id: 'kvCache.button.testConnection' })}
      </Button>
      {result && (
        <Alert
          type={result.type}
          message={result.message}
          showIcon
          style={{ marginTop: 10 }}
        />
      )}
    </div>
  );
};

export default TestConnection;
