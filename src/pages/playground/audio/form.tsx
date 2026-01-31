import SealInput from '@/components/seal-form/seal-input';
import UploadAudio from '@/components/upload-audio';
import { convertFileToBase64 } from '@/utils/load-audio-file';
import { CloseCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { useFormContext } from '../config/form-context';

const SuffixWrapper = styled.div`
  .icon {
    font-size: 12px;
    color: var(--ant-color-text-quaternary);
    cursor: pointer;
    &:hover {
      color: var(--ant-color-text-tertiary);
    }
  }
`;

export const RefAudioFormItem: React.FC = () => {
  const { meta, onValuesChange } = useFormContext();
  const form = Form.useFormInstance();
  const intl = useIntl();
  const [fileName, setFileName] = React.useState<string>('');

  // handle upload audio file, transfer to a base64 url
  const handleUploadChange = async (data: { file: any; fileList: any }) => {
    const { file } = data;
    const base64 = await convertFileToBase64(file);
    form.setFieldsValue({
      ref_audio: base64
    });
    setFileName(file.name);

    console.log('Uploaded file base64 url:', base64);
    onValuesChange?.(
      { ref_audio: base64 },
      { ...form.getFieldsValue(), ref_audio: base64 }
    );
  };

  const handleClear = () => {
    form.setFieldsValue({
      ref_audio: ''
    });
    setFileName('');
    onValuesChange?.(
      { ref_audio: '' },
      { ...form.getFieldsValue(), ref_audio: '' }
    );
  };

  return (
    <Form.Item
      name="ref_audio"
      getValueProps={(value) => ({ value: fileName ? fileName : value })}
    >
      <SealInput.Input
        allowClear
        readOnly={!!fileName}
        suffix={
          <SuffixWrapper>
            {fileName ? (
              <span onClick={handleClear}>
                <CloseCircleFilled className="icon" />
              </span>
            ) : null}
            <UploadAudio
              size="small"
              type="text"
              accept={['.mp3', '.mp4', '.wav', '.m4a'].join(', ')}
              onChange={handleUploadChange}
            ></UploadAudio>
          </SuffixWrapper>
        }
        description={intl.formatMessage({
          id: 'playground.params.refAudio.tips'
        })}
        label={intl.formatMessage({ id: 'playground.params.refAudio' })}
      ></SealInput.Input>
    </Form.Item>
  );
};
