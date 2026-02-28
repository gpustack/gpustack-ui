import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInput from '@/components/seal-form/seal-input';
import UploadAudio from '@/components/upload-audio';
import useAppUtils from '@/hooks/use-app-utils';
import { convertFileToBase64 } from '@/utils/load-audio-file';
import { CloseCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { useFormContext } from '../config/form-context';

const SuffixWrapper = styled.div.attrs({
  className: 'suffix-wrapper'
})`
  display: flex;
  align-items: center;
  .icon {
    display: none;
    font-size: 12px;
    color: var(--ant-color-text-quaternary);
    cursor: pointer;
    &:hover {
      color: var(--ant-color-text-tertiary);
    }
  }
`;

const Container = styled.div`
  &:hover {
    .suffix-wrapper {
      .icon {
        display: block;
      }
    }
  }
`;

export const RefAudioFormItem: React.FC = () => {
  const { getRuleMessage } = useAppUtils();
  const { meta, onValuesChange } = useFormContext();
  const form = Form.useFormInstance();
  const intl = useIntl();
  const [fileName, setFileName] = React.useState<string>('');
  const taskType = Form.useWatch('task_type', form);

  // handle upload audio file, transfer to a base64 url
  const handleUploadChange = async (data: { file: any; fileList: any }) => {
    const { file } = data;
    const base64 = await convertFileToBase64(file);
    form.setFieldsValue({
      ref_audio: base64
    });
    setFileName(file.name);

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
    <>
      <Container>
        <Form.Item
          name="ref_audio"
          getValueProps={(value) => ({ value: fileName ? fileName : value })}
          rules={[
            {
              required: taskType === 'Base',
              message: getRuleMessage('input', 'playground.params.refAudio')
            }
          ]}
          dependencies={['task_type']}
        >
          <SealInput.Input
            allowClear
            readOnly={!!fileName}
            required={taskType === 'Base'}
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
      </Container>
      <Form.Item name="ref_text" style={{ marginBottom: 8 }}>
        <SealInput.TextArea
          allowClear
          scaleSize={true}
          label={intl.formatMessage({ id: 'playground.params.refAudio.text' })}
        ></SealInput.TextArea>
      </Form.Item>
      <Form.Item name="x_vector_only_mode" valuePropName="checked">
        <CheckboxField
          label={intl.formatMessage({
            id: 'playground.params.refAudio.vectorMode'
          })}
        ></CheckboxField>
      </Form.Item>
    </>
  );
};
