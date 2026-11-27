import { Select as SealSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form } from 'antd';
import {
  isValidVideoMediaUrl,
  isVideoMediaSource,
  VideoMediaRules,
  VideoMediaSource,
  VideoMediaType,
  VideoReference
} from '../media-inputs';
import ReferenceMediaInput from './reference-media-input';

const ReferenceSource = ({
  value = [],
  onChange,
  rules
}: {
  value?: VideoReference[];
  onChange?: (value: VideoReference[]) => void;
  rules: VideoMediaRules;
}) => {
  const intl = useIntl();
  const types = (['image', 'video', 'audio'] as VideoMediaType[]).filter(
    (type) => rules[type] && !(rules.requires_visual && type === 'audio')
  );
  const reference =
    value[0] && types.includes(value[0].type)
      ? value[0]
      : { type: types[0], source: undefined };
  return (
    <Flex vertical gap="small">
      {types.length > 1 && (
        <Form.Item noStyle validateStatus="">
          <SealSelect
            label={intl.formatMessage({ id: 'playground.video.references' })}
            value={reference.type}
            options={types.map((type) => ({
              value: type,
              label: intl.formatMessage({
                id: `playground.video.media.${type}`
              })
            }))}
            onChange={(type: VideoMediaType) =>
              onChange?.([{ type, source: undefined }])
            }
          />
        </Form.Item>
      )}
      <ReferenceMediaInput
        mediaType={reference.type}
        value={reference.source}
        label={intl.formatMessage({
          id: `playground.video.media.${reference.type}`
        })}
        onChange={(source) => onChange?.([{ ...reference, source }])}
      />
    </Flex>
  );
};

export default function ReferenceInputs({ rules }: { rules: VideoMediaRules }) {
  const intl = useIntl();
  const validateUrl = (_: unknown, value: VideoMediaSource) => {
    if (!isValidVideoMediaUrl(value))
      return Promise.reject(
        new Error(intl.formatMessage({ id: 'playground.video.media.invalid' }))
      );
    return Promise.resolve();
  };
  if (rules.keyframes)
    return (
      <>
        <Form.Item
          name="firstFrame"
          dependencies={['lastFrame']}
          preserve={false}
          rules={[
            { validator: validateUrl },
            ({ getFieldValue }) => ({
              validator: async (_, value) => {
                if (
                  !isVideoMediaSource(value) &&
                  !isVideoMediaSource(getFieldValue('lastFrame'))
                ) {
                  throw new Error(
                    intl.formatMessage({
                      id: 'playground.video.keyframes.required'
                    })
                  );
                }
              }
            })
          ]}
        >
          <ReferenceMediaInput
            label={intl.formatMessage({ id: 'playground.video.firstFrame' })}
            uploadOnly
          />
        </Form.Item>
        <Form.Item
          name="lastFrame"
          preserve={false}
          rules={[{ validator: validateUrl }]}
        >
          <ReferenceMediaInput
            label={intl.formatMessage({ id: 'playground.video.lastFrame' })}
            uploadOnly
          />
        </Form.Item>
      </>
    );
  return (
    <Form.Item
      name="references"
      preserve={false}
      rules={[
        {
          validator: async (_, value: VideoReference[] = []) => {
            if (
              !value[0] ||
              !rules[value[0].type] ||
              !isVideoMediaSource(value[0].source)
            ) {
              throw new Error(
                intl.formatMessage({
                  id: 'playground.video.references.required'
                })
              );
            }
            if (!isValidVideoMediaUrl(value[0].source)) {
              throw new Error(
                intl.formatMessage({ id: 'playground.video.media.invalid' })
              );
            }
            if (
              rules.requires_visual &&
              !(value[0].type === 'image' || value[0].type === 'video')
            ) {
              throw new Error(
                intl.formatMessage({
                  id: 'playground.video.references.visualRequired'
                })
              );
            }
          }
        }
      ]}
    >
      <ReferenceSource rules={rules} />
    </Form.Item>
  );
}
