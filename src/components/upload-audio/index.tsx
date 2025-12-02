import { UploadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip, Upload, message } from 'antd';
import React from 'react';
import { convertFileSize } from '../../utils';

interface UploadAudioProps {
  accept?: string;
  maxCount?: number;
  type?: 'text' | 'primary' | 'default';
  icon?: React.ReactNode;
  size?: 'small' | 'middle' | 'large';
  shape?: 'circle' | 'round' | 'default';
  maxFileSize?: number; // in bytes
  onChange?: (data: { file: any; fileList: any[] }) => void;
}

const UploadAudio: React.FC<UploadAudioProps> = (props) => {
  const [messageApi, contextHolder] = message.useMessage();
  const { icon, accept, type, size = 'large', shape = 'circle' } = props;
  const intl = useIntl();
  const beforeUpload = (file: any) => {
    return false;
  };

  const isFileSizeValid = (file: File) => {
    if (props.maxFileSize && file.size > props.maxFileSize) {
      messageApi.open({
        type: 'warning',
        content: intl.formatMessage(
          { id: 'playground.uploadfile.sizeError' },
          { size: `${convertFileSize(props.maxFileSize)}` } // Convert bytes to MB
        )
      });
      return false;
    }
    return true;
  };

  const handleOnChange = (data: { file: any; fileList: any }) => {
    if (!isFileSizeValid(data.file)) {
      return;
    }
    props.onChange?.(data);
  };

  return (
    <Tooltip
      styles={{
        body: {
          maxWidth: 290,
          width: 'max-content'
        }
      }}
      title={intl.formatMessage(
        { id: 'playground.audio.uploadfile.tips' },
        { formats: props.accept }
      )}
    >
      <Upload
        beforeUpload={beforeUpload}
        onChange={handleOnChange}
        accept={props.accept}
        multiple={false}
        maxCount={1}
        showUploadList={false}
        fileList={[]}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}
        >
          <Button
            size={size}
            icon={icon ?? <UploadOutlined />}
            type={props.type ?? 'text'}
            shape={shape}
          ></Button>
        </div>
      </Upload>
      {contextHolder}
    </Tooltip>
  );
};

export default UploadAudio;
