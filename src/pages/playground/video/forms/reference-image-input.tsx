import { CloseCircleFilled, UploadOutlined } from '@ant-design/icons';
import { Input } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { App, Button, Flex, Tooltip, Upload } from 'antd';
import type { ChangeEvent } from 'react';
import { EDIT_IMAGE_ACCEPT } from '../../config';
import styles from './reference-image-input.module.less';

type Props = {
  id?: string;
  value?: File | string;
  onChange?: (value?: File | string) => void;
};

export default function ReferenceImageInput({ id, value, onChange }: Props) {
  const intl = useIntl();
  const { message } = App.useApp();
  const file = value instanceof File ? value : undefined;
  const uploadLabel = intl.formatMessage({ id: 'playground.img.upload' });
  const clearLabel = intl.formatMessage({ id: 'common.button.clear' });

  return (
    <div className={styles.field}>
      <Input.Input
        id={id}
        label={intl.formatMessage({ id: 'playground.params.refImage' })}
        placeholder={intl.formatMessage({
          id: 'playground.uploadImage.url.holder'
        })}
        description={intl.formatMessage({
          id: 'playground.params.refImage.tips'
        })}
        value={typeof value === 'string' ? value : (file?.name ?? '')}
        readOnly={Boolean(file)}
        allowClear={!file}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange?.(event.target.value)
        }
        suffix={
          <Flex align="center">
            {file && (
              <button
                className={styles.clearButton}
                type="button"
                aria-label={clearLabel}
                title={clearLabel}
                onClick={() => onChange?.(undefined)}
              >
                <CloseCircleFilled />
              </button>
            )}
            <Upload
              accept={EDIT_IMAGE_ACCEPT}
              showUploadList={false}
              beforeUpload={(selectedFile) => {
                const supported = selectedFile.type
                  ? EDIT_IMAGE_ACCEPT.split(',').includes(selectedFile.type)
                  : /\.(png|jpe?g)$/i.test(selectedFile.name);
                if (supported) {
                  onChange?.(selectedFile);
                } else {
                  message.error(
                    intl.formatMessage(
                      { id: 'common.file.format.limit' },
                      { formats: 'PNG, JPEG' }
                    )
                  );
                }
                return Upload.LIST_IGNORE;
              }}
            >
              <Tooltip title={uploadLabel}>
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  icon={<UploadOutlined />}
                  aria-label={uploadLabel}
                />
              </Tooltip>
            </Upload>
          </Flex>
        }
      />
    </div>
  );
}
