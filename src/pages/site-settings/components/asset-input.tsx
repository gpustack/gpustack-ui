import { UploadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Flex, Typography, Upload, message } from 'antd';
import { useState } from 'react';

export default function AssetInput({
  value,
  onChange,
  label,
  onReading
}: {
  value?: string | null;
  onChange?: (value: string | null) => void;
  label: string;
  onReading: (reading: boolean) => void;
}) {
  const intl = useIntl();
  const [reading, setReading] = useState(false);
  return (
    <Flex justify="space-between" align="center" gap="middle" wrap>
      {value ? (
        <img
          src={value}
          alt={label}
          style={{ maxWidth: 180, maxHeight: 48, objectFit: 'contain' }}
        />
      ) : (
        <Typography.Text type="secondary">
          {intl.formatMessage({ id: 'siteSettings.defaultAsset' })}
        </Typography.Text>
      )}
      <Flex gap="small" align="center">
        <Upload
          accept="image/png,image/jpeg,image/webp"
          showUploadList={false}
          disabled={reading || undefined}
          beforeUpload={async (file) => {
            if (
              file.size > 512 * 1024 ||
              !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
            ) {
              message.error(
                intl.formatMessage({ id: 'siteSettings.assetHint' })
              );
              return Upload.LIST_IGNORE;
            }
            setReading(true);
            onReading(true);
            try {
              const data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
              });
              onChange?.(data);
            } catch {
              message.error(
                intl.formatMessage({ id: 'siteSettings.assetReadError' })
              );
            } finally {
              setReading(false);
              onReading(false);
            }
            return Upload.LIST_IGNORE;
          }}
        >
          <Button icon={<UploadOutlined />} loading={reading}>
            {intl.formatMessage({ id: 'siteSettings.upload' })}
          </Button>
        </Upload>
        {value && (
          <Button
            type="link"
            disabled={reading || undefined}
            onClick={() => onChange?.(null)}
          >
            {intl.formatMessage({ id: 'siteSettings.clear' })}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
