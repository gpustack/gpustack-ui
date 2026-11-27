import { CloseCircleFilled, UploadOutlined } from '@ant-design/icons';
import { Input } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { App, Button, Flex, Tooltip, Upload } from 'antd';
import type { ChangeEvent } from 'react';
import { EDIT_IMAGE_ACCEPT } from '../../config';
import { VideoMediaType } from '../media-inputs';
import styles from './reference-image-input.module.less';

type Props = {
  id?: string;
  value?: File | string;
  onChange?: (value?: File | string) => void;
  mediaType?: VideoMediaType;
  label?: string;
  uploadOnly?: boolean;
};

export default function ReferenceMediaInput({
  id,
  value,
  onChange,
  mediaType = 'image',
  label,
  uploadOnly = false
}: Props) {
  const intl = useIntl();
  const { message } = App.useApp();
  const file = value instanceof File ? value : undefined;
  const uploadLabel = intl.formatMessage({ id: 'common.button.upload' });
  const clearLabel = intl.formatMessage({ id: 'common.button.clear' });
  const formats = {
    image: {
      accept: EDIT_IMAGE_ACCEPT,
      extensions: /\.(png|jpe?g)$/i,
      names: 'PNG, JPEG',
      max: 1
    },
    video: {
      accept: 'video/mp4,video/quicktime',
      extensions: /\.(mp4|mov)$/i,
      names: 'MP4, MOV',
      max: 2
    },
    audio: {
      accept: 'audio/mpeg,audio/wav,audio/x-wav',
      extensions: /\.(mp3|wav)$/i,
      names: 'MP3, WAV',
      max: 1
    }
  }[mediaType];

  return (
    <div className={styles.field}>
      <Input.Input
        id={id}
        aria-label={
          label ?? intl.formatMessage({ id: 'playground.params.refImage' })
        }
        label={
          label ?? intl.formatMessage({ id: 'playground.params.refImage' })
        }
        placeholder={intl.formatMessage({
          id:
            mediaType === 'image'
              ? 'playground.video.media.uploadImage'
              : 'playground.video.media.url'
        })}
        description={intl.formatMessage(
          { id: 'playground.video.media.formats' },
          { formats: formats.names, size: formats.max }
        )}
        value={typeof value === 'string' ? value : (file?.name ?? '')}
        readOnly={uploadOnly || Boolean(file)}
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
              accept={formats.accept}
              showUploadList={false}
              beforeUpload={(selectedFile) => {
                const supported = selectedFile.type
                  ? formats.accept.split(',').includes(selectedFile.type)
                  : formats.extensions.test(selectedFile.name);
                if (
                  supported &&
                  selectedFile.size <= formats.max * 1024 * 1024
                ) {
                  onChange?.(selectedFile);
                } else {
                  message.error(
                    intl.formatMessage(
                      {
                        id: supported
                          ? 'common.file.size.limit'
                          : 'common.file.format.limit'
                      },
                      { formats: formats.names, size: `${formats.max} MiB` }
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
