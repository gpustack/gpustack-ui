import { UploadOutlined } from '@ant-design/icons';
import { Button, Tooltip, Upload } from 'antd';
import React from 'react';

interface UploadAudioProps {
  accept?: string;
  maxCount?: number;
  type?: 'text' | 'primary' | 'default';
  onChange?: (data: { file: any; fileList: any[] }) => void;
}

const UploadAudio: React.FC<UploadAudioProps> = (props) => {
  const beforeUpload = (file: any) => {
    return true;
  };

  const handleOnChange = React.useCallback(
    (data: { file: any; fileList: any }) => {
      console.log('handleOnChange', data);
      props.onChange?.(data);
    },
    []
  );
  return (
    <Tooltip title={`Upload an audio file, support for ${props.accept}`}>
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
            icon={<UploadOutlined />}
            type={props.type ?? 'text'}
            shape="circle"
          ></Button>
        </div>
      </Upload>
    </Tooltip>
  );
};

export default React.memo(UploadAudio);
