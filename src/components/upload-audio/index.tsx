import { UploadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip, Upload } from 'antd';
import React from 'react';

interface UploadAudioProps {
  accept?: string;
  maxCount?: number;
  type?: 'text' | 'primary' | 'default';
  icon?: React.ReactNode;
  size?: 'small' | 'middle' | 'large';
  shape?: 'circle' | 'round' | 'default';
  onChange?: (data: { file: any; fileList: any[] }) => void;
}

const UploadAudio: React.FC<UploadAudioProps> = (props) => {
  const { icon, accept, type, size = 'large', shape = 'circle' } = props;
  const intl = useIntl();
  const beforeUpload = (file: any) => {
    return false;
  };

  const handleOnChange = (data: { file: any; fileList: any }) => {
    props.onChange?.(data);
  };

  return (
    <Tooltip
      overlayInnerStyle={{ maxWidth: 290, width: 'max-content' }}
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
    </Tooltip>
  );
};

export default React.memo(UploadAudio);
