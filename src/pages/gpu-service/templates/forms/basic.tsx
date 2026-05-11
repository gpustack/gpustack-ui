import {
  Input as CInput,
  InputNumber,
  Select as SealSelect,
  Textarea,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form } from 'antd';
import { useMemo } from 'react';
import { GPUsConfigs } from '../../../resources/config/gpu-driver';
import {
  ImagePullPolicyOptions,
  normalizeCommand,
  stringifyCommand
} from '../config';
import { FormData } from '../config/types';
import Env from './env';
import Ports from './ports';

export interface BasicResourceMax {
  cpu?: number | null;
  memory?: number | null;
  localStorage?: number | null;
}

interface BasicProps {
  page?: 'template' | 'instance';
  onceMaxRequest?: BasicResourceMax;
}

const Basic: React.FC<BasicProps> = ({ page = 'template', onceMaxRequest }) => {
  const { getRuleMessage } = useAppUtils();
  const intl = useIntl();

  const manufacturerOptions = useMemo(
    () =>
      Object.values(GPUsConfigs).map((item) => ({
        label: item.label,
        value: item.gpuVendor
      })),
    []
  );

  const renderMaxLabel = (
    label: React.ReactNode,
    max?: number | null
  ): React.ReactNode => {
    if (max == null) return label;
    return (
      <Flex gap={4} align="center">
        {label}
        <span>
          ({intl.formatMessage({ id: 'common.max' }, { count: max })})
        </span>
      </Flex>
    );
  };

  return (
    <>
      <div data-field="template"></div>
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
        </>
      )}

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
        normalize={normalizeCommand}
        getValueProps={(value) => ({ value: stringifyCommand(value) })}
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
              label={intl.formatMessage({
                id: 'gpuservice.template.mountPath'
              })}
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
              label={renderMaxLabel(
                intl.formatMessage({ id: 'gpuservice.template.containerDisk' }),
                onceMaxRequest?.localStorage
              )}
              max={onceMaxRequest?.localStorage ?? undefined}
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
            <InputNumber
              label={renderMaxLabel('CPU', onceMaxRequest?.cpu)}
              max={onceMaxRequest?.cpu ?? undefined}
            />
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
              label={renderMaxLabel(
                intl.formatMessage({ id: 'gpuservice.template.memory' }),
                onceMaxRequest?.memory
              )}
              max={onceMaxRequest?.memory ?? undefined}
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
