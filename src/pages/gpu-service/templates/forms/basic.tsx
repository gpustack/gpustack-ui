import PluginExtraFields from '@/components/plugin-extra-fields';
import { validateLabelNameRegxFor63 } from '@/config';
import { PageActionType } from '@/config/types';
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
import formStyles from '../../instances/styles/instances.module.less';
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
  action?: PageActionType;
  disabled?: boolean;
  onceMaxRequest?: BasicResourceMax;
}

const Basic: React.FC<BasicProps> = ({
  page = 'template',
  action,
  onceMaxRequest,
  disabled
}) => {
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

  const renderStorageLabel = (): React.ReactNode => {
    if (page === 'instance' && onceMaxRequest?.localStorage != null) {
      return intl.formatMessage(
        { id: 'gpuservice.instance.containerDisk.remaining' },
        { count: onceMaxRequest.localStorage }
      );
    }
    return intl.formatMessage({ id: 'gpuservice.template.containerDisk' });
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
              },
              {
                pattern: validateLabelNameRegxFor63,
                message: intl.formatMessage({
                  id: 'gpuservice.form.rule.name'
                })
              }
            ]}
          >
            <CInput.Input
              disabled={disabled}
              label={intl.formatMessage({ id: 'common.table.name' })}
              required
            />
          </Form.Item>
          <Form.Item<FormData>
            name="displayName"
            rules={[
              {
                max: 63,
                message: intl.formatMessage({
                  id: 'gpuservice.template.displayName.max'
                })
              }
            ]}
          >
            <CInput.Input
              label={intl.formatMessage({
                id: 'gpuservice.template.displayName'
              })}
              showCount
              trim={false}
              maxLength={63}
            />
          </Form.Item>
          <PluginExtraFields
            name="CreateOrgScopeField"
            context={{ action, allowGlobal: true }}
          />
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
              disabled={disabled}
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
          disabled={disabled}
          label={intl.formatMessage({ id: 'gpuservice.template.image' })}
          required
        />
      </Form.Item>
      <Form.Item<FormData> name={['spec', 'imagePullPolicy']}>
        <SealSelect
          disabled={disabled}
          label={intl.formatMessage({
            id: 'gpuservice.template.imagePullPolicy'
          })}
          options={ImagePullPolicyOptions.map((item) => ({
            label: intl.formatMessage({ id: item.label }),
            value: item.value
          }))}
        />
      </Form.Item>
      <div className={formStyles.command}>
        <Form.Item<FormData>
          name={['spec', 'command']}
          normalize={normalizeCommand}
          getValueProps={(value) => ({ value: stringifyCommand(value) })}
        >
          <Textarea
            disabled={disabled}
            label={intl.formatMessage({ id: 'gpuservice.template.command' })}
            placeholder={intl.formatMessage({
              id: 'gpuservice.template.command.placeholder'
            })}
            trim={false}
            alwaysFocus
            scaleSize
          />
        </Form.Item>
      </div>

      <Flex gap={12}>
        {page === 'template' && (
          <div style={{ flex: 1 }}>
            <Form.Item<FormData> name={['spec', 'volumeMount']}>
              <CInput.Input
                label={intl.formatMessage({
                  id: 'gpuservice.template.mountPath'
                })}
                placeholder={intl.formatMessage({
                  id: 'clusters.volume.mountPath.format'
                })}
                disabled={disabled}
              />
            </Form.Item>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name={['spec', 'resources', 'localStorage']}
            normalize={(value) => (value ? `${value}Gi` : undefined)}
            getValueProps={(value) => ({
              value: value ? String(value).replace(/Gi$/, '') : ''
            })}
          >
            <InputNumber
              label={renderStorageLabel()}
              max={onceMaxRequest?.localStorage ?? undefined}
              disabled={disabled}
            />
          </Form.Item>
        </div>
      </Flex>
      <Ports disabled={disabled} />
      <Env disabled={disabled} />
    </>
  );
};

export default Basic;
