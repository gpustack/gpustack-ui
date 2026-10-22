import { convertFileToBase64 } from '@/utils/load-audio-file';
import { CloseCircleFilled } from '@ant-design/icons';
import {
  CheckboxField,
  Input as CInput,
  InputNumber,
  UploadAudio,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useFormContext } from '../../config/form-context';

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

const TTSAdvanceConfig: React.FC = () => {
  const { getRuleMessage } = useAppUtils();
  const { meta, onValuesChange } = useFormContext();
  const form = Form.useFormInstance();
  const intl = useIntl();
  const [fileName, setFileName] = React.useState<string>('');
  const taskType = Form.useWatch('task_type', form);
  const refAudio = Form.useWatch('ref_audio', form);

  // Three-state flag: only an explicit false means the checkpoint is missing the
  // audio encoder that voice cloning needs, and a ref_audio request would take
  // the whole engine down. An absent flag claims nothing — the models that do
  // support cloning (CosyVoice, Qwen3-TTS) never carry it, and neither does an
  // instance that has not reported its meta yet — so ref_audio stays available.
  const voiceCloningUnsupported = meta?.voice_cloning === false;

  // handle upload audio file, transfer to a base64 url
  const handleUploadChange = async (data: { file: any; fileList: any }) => {
    const { file } = data;
    const base64 = await convertFileToBase64(file);
    form.setFieldsValue({
      ref_audio: base64
    });
    setFileName(file.name);
    form.validateFields(['ref_audio']);

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
    form.validateFields(['ref_audio']);
    onValuesChange?.(
      { ref_audio: '' },
      { ...form.getFieldsValue(), ref_audio: '' }
    );
  };

  const atLeastOneValidator = (relateField: string) => () => ({
    validator(rule: any, value: string) {
      const type = form.getFieldValue('task_type');
      const relateFieldValue = form.getFieldValue(relateField);
      if (type !== 'Base') return Promise.resolve();

      // Both fields that satisfy this rule are disabled without an audio
      // encoder, so demanding one would leave the form unsubmittable.
      if (voiceCloningUnsupported) return Promise.resolve();

      if (value || relateFieldValue) return Promise.resolve();

      return Promise.reject(
        new Error(
          intl.formatMessage({ id: 'playground.speech.rules.refAudio' })
        )
      );
    }
  });

  useEffect(() => {
    if (taskType === 'Base') {
      form.setFieldsValue({
        x_vector_only_mode: true
      });
      onValuesChange?.(
        { x_vector_only_mode: true },
        { ...form.getFieldsValue(), x_vector_only_mode: true }
      );
    }
  }, [taskType]);

  // fileName only stands in for ref_audio in the input's display, so follow the
  // form value rather than the model's capability: every path that empties
  // ref_audio — a model switch resetting the form, whether or not the next model
  // supports cloning — has to drop the name too, or the input keeps showing (and
  // stays readOnly for) a file that is no longer part of the request.
  useEffect(() => {
    if (!refAudio) {
      setFileName('');
    }
  }, [refAudio]);

  return (
    <>
      <Form.Item
        name="instructions"
        rules={[
          {
            required: taskType === 'VoiceDesign',
            message: getRuleMessage('input', 'playground.params.instructions')
          }
        ]}
      >
        <CInput.Input
          allowClear
          required={taskType === 'VoiceDesign'}
          description={intl.formatMessage({
            id: 'playground.params.instructions.tips'
          })}
          label={intl.formatMessage({ id: 'playground.params.instructions' })}
        ></CInput.Input>
      </Form.Item>
      <Form.Item
        name="max_new_tokens"
        getValueProps={(value) => ({ value: value || null })}
      >
        <InputNumber
          min={0}
          step={1}
          max={4096}
          label={intl.formatMessage({ id: 'playground.params.maxTokens' })}
        ></InputNumber>
      </Form.Item>
      <Container>
        <Form.Item
          name="ref_audio"
          getValueProps={(value) => ({ value: fileName ? fileName : value })}
          dependencies={['task_type']}
          rules={[
            {
              // A disabled field can still fail validation, and this one cannot
              // be filled in, so a model reporting both task_type Base and no
              // audio encoder would otherwise never submit.
              required: taskType === 'Base' && !voiceCloningUnsupported,
              whitespace: true,
              message: getRuleMessage('input', 'playground.params.refAudio')
            }
          ]}
        >
          <CInput.Input
            allowClear
            disabled={voiceCloningUnsupported}
            required={taskType === 'Base' && !voiceCloningUnsupported}
            readOnly={!!fileName}
            suffix={
              voiceCloningUnsupported ? null : (
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
              )
            }
            description={intl.formatMessage({
              id: voiceCloningUnsupported
                ? 'playground.params.refAudio.unsupported'
                : 'playground.params.refAudio.tips'
            })}
            label={intl.formatMessage({ id: 'playground.params.refAudio' })}
          ></CInput.Input>
        </Form.Item>
      </Container>
      <Form.Item name="ref_text" style={{ marginBottom: 12 }}>
        <CInput.TextArea
          allowClear
          disabled={voiceCloningUnsupported}
          scaleSize={true}
          label={intl.formatMessage({ id: 'playground.params.refAudio.text' })}
        ></CInput.TextArea>
      </Form.Item>
      <Form.Item
        dependencies={['task_type', 'ref_text']}
        style={{ marginBottom: 12 }}
        name="x_vector_only_mode"
        valuePropName="checked"
        rules={[atLeastOneValidator('ref_text')]}
      >
        <CheckboxField
          disabled={voiceCloningUnsupported}
          label={intl.formatMessage({
            id: 'playground.params.refAudio.vectorMode'
          })}
        ></CheckboxField>
      </Form.Item>
    </>
  );
};

export default TTSAdvanceConfig;
