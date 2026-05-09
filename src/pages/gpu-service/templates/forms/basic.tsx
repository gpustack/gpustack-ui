import {
  Input as CInput,
  InputNumber,
  Select as SealSelect,
  Textarea,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form } from 'antd';
import _ from 'lodash';
import { useMemo } from 'react';
import { GPUsConfigs } from '../../../resources/config/gpu-driver';
import { ImagePullPolicyOptions } from '../config';
import { FormData } from '../config/types';
import Env from './env';
import Ports from './ports';

interface BasicProps {
  page?: 'template' | 'instance';
}

const Basic: React.FC<BasicProps> = ({ page = 'template' }) => {
  const { getRuleMessage } = useAppUtils();
  const intl = useIntl();

  const manufacturerOptions = useMemo(
    () =>
      Object.values(GPUsConfigs).map((item) => ({
        label: item.label,
        value: item.value
      })),
    []
  );

  return (
    <>
      {page === 'template' && (
        <>
          <Form.Item<FormData>
            name="name"
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'common.table.name')
              }
            ]}
          >
            <CInput.Input
              label={intl.formatMessage({ id: 'common.table.name' })}
              required
            />
          </Form.Item>
        </>
      )}
      <Form.Item<FormData>
        name="manufacturer"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'resources.table.vendor')
          }
        ]}
      >
        <SealSelect
          label={intl.formatMessage({ id: 'resources.table.vendor' })}
          required
          options={[...manufacturerOptions, { label: 'CPU', value: 'cpu' }]}
        />
      </Form.Item>
      <Form.Item<FormData>
        name={['spec', 'image']}
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'gpuservice.template.image')
          }
        ]}
      >
        <CInput.Input
          label={intl.formatMessage({ id: 'gpuservice.template.image' })}
          required
        />
      </Form.Item>
      <Form.Item<FormData> name={['spec', 'imagePullPolicy']}>
        <SealSelect
          label={intl.formatMessage({
            id: 'gpuservice.template.imagePullPolicy'
          })}
          options={ImagePullPolicyOptions.map((item) => ({
            label: intl.formatMessage({ id: item.label }),
            value: item.value
          }))}
        />
      </Form.Item>
      <Form.Item<FormData>
        name={['spec', 'command']}
        normalize={(value: string) => _.split(value, '\n').map(_.trim)}
        getValueProps={(value) => ({ value: _.join(value, '\n') })}
      >
        <Textarea
          label={intl.formatMessage({ id: 'gpuservice.template.command' })}
          placeholder={intl.formatMessage({
            id: 'gpuservice.template.command.placeholder'
          })}
          trim={false}
          alwaysFocus
          scaleSize
        />
      </Form.Item>

      <Flex gap={16}>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData> name={['spec', 'volumeMount']}>
            <CInput.Input
              label={intl.formatMessage({ id: 'gpuservice.template.mountPath' })}
              placeholder={intl.formatMessage({
                id: 'clusters.volume.mountPath.format'
              })}
            />
          </Form.Item>
        </div>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name={['spec', 'resources', 'localStorage']}
            normalize={(value) => (value ? `${value}Gi` : undefined)}
            getValueProps={(value) => ({
              value: value ? String(value).replace(/Gi$/, '') : ''
            })}
          >
            <InputNumber
              label={intl.formatMessage({
                id: 'gpuservice.template.containerDisk'
              })}
            />
          </Form.Item>
        </div>
      </Flex>
      <Flex gap={16}>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name={['spec', 'resources', 'cpu']}
            normalize={(value) => (value ? `${value}` : '')}
            getValueProps={(value) => ({ value: value ? String(value) : '' })}
          >
            <InputNumber label="CPU" />
          </Form.Item>
        </div>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name={['spec', 'resources', 'ram']}
            normalize={(value) => (value ? `${value}Gi` : undefined)}
            getValueProps={(value) => ({
              value: value ? String(value).replace(/Gi$/, '') : ''
            })}
          >
            <InputNumber
              label={intl.formatMessage({ id: 'gpuservice.template.memory' })}
            />
          </Form.Item>
        </div>
      </Flex>

      <Ports />
      <Env />
    </>
  );
};

export default Basic;
