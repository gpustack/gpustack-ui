import { validateLabelNameRegxFor63 } from '@/config';
import {
  Input as CInput,
  InputNumber,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { ArchOptions, GPU_INSTANCE_TYPE_OS } from '../config';
import { FlavorItem, FormData } from '../config/types';

// RAM / storage are entered as a plain number in GB but stored/submitted as a
// "Gi" quantity string. These drive the FormItem's submit (`normalize`) and
// display (`getValueProps`) conversions.
const giNormalize = (value?: number | string | null) =>
  value ? `${value}Gi` : undefined;
const giValueProps = (value?: string | null) => ({
  value: value ? String(value).replace(/Gi$/i, '') : ''
});

interface InstanceTypeFormProps {
  ref?: any;
  open: boolean;
  // The flavor picked in the drawer's first column. Its acceleratorGroup /
  // generalGroup / acceleratable are copied into the created instance type.
  selectedFlavor?: FlavorItem | null;
  onFinish: (values: FormData) => Promise<void>;
  onFinishFailed?: (errorInfo: any) => void;
}

const GPUServiceInstanceTypeForm: React.FC<InstanceTypeFormProps> = forwardRef(
  (props, ref) => {
    const { open, selectedFlavor, onFinish, onFinishFailed } = props;
    const intl = useIntl();
    const { getRuleMessage } = useAppUtils();
    const [form] = Form.useForm<FormData>();

    // A non-acceleratable (generic) flavor has no per-GPU concept, so unit CPU
    // is fixed to 1 and the field is disabled.
    const acceleratable = !!selectedFlavor?.spec?.acceleratable;

    useEffect(() => {
      if (!open) {
        form.resetFields();
        return;
      }
      form.setFieldsValue({
        spec: {
          arch: ArchOptions[0].value
        }
      } as any);
    }, [open, form]);

    // Force unit CPU to 1 whenever the picked flavor is not acceleratable.
    useEffect(() => {
      if (!open || acceleratable) return;
      form.setFieldValue(['spec', 'unitResources', 'cpu'], 1);
    }, [open, acceleratable, form]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.submit();
      },
      resetFields: () => {
        form.resetFields();
      }
    }));

    const handleFinish = async (values: FormData) => {
      // The hardware group / acceleratable flags are not user-editable; they
      // come from the chosen flavor. os is fixed to lowercase "linux". ram /
      // localStorage already carry the "Gi" suffix from the FormItem normalize.
      const cpu = values.spec?.unitResources?.cpu;
      await onFinish({
        name: values.name,
        spec: {
          acceleratorGroup: selectedFlavor?.spec?.acceleratorGroup ?? null,
          generalGroup: selectedFlavor?.spec?.generalGroup ?? null,
          acceleratable: selectedFlavor?.spec?.acceleratable ?? false,
          os: GPU_INSTANCE_TYPE_OS,
          arch: values.spec?.arch ?? null,
          unitResources: {
            cpu: cpu != null && cpu !== '' ? String(cpu) : null,
            ram: values.spec?.unitResources?.ram ?? null
          },
          localStorage: values.spec?.localStorage ?? null
        }
      });
    };

    return (
      <Form
        name="gpuServiceInstanceTypeForm"
        form={form}
        onFinish={handleFinish}
        onFinishFailed={onFinishFailed}
        preserve={false}
      >
        <Form.Item<FormData>
          name="name"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'common.table.name')
            },
            {
              pattern: validateLabelNameRegxFor63,
              message: intl.formatMessage({ id: 'gpuservice.form.rule.name' })
            }
          ]}
        >
          <CInput.Input
            label={intl.formatMessage({ id: 'common.table.name' })}
            required
          />
        </Form.Item>

        <Form.Item>
          <CInput.Input
            disabled
            value="Linux"
            label={intl.formatMessage({ id: 'gpuservice.instance.os' })}
          />
        </Form.Item>

        <Form.Item<FormData>
          name={['spec', 'arch']}
          rules={[
            {
              required: true,
              message: getRuleMessage('select', 'gpuservice.instance.arch')
            }
          ]}
        >
          <SealSelect
            label={intl.formatMessage({ id: 'gpuservice.instance.arch' })}
            required
            options={ArchOptions}
          />
        </Form.Item>

        <Form.Item<FormData>
          name={['spec', 'unitResources', 'cpu']}
          rules={[
            {
              required: true,
              message: getRuleMessage(
                'input',
                'gpuservice.instanceType.unitCpu'
              )
            }
          ]}
        >
          <InputNumber
            min={0}
            disabled={!acceleratable}
            style={{ width: '100%' }}
            label={intl.formatMessage({
              id: 'gpuservice.instanceType.unitCpu'
            })}
            description={intl.formatMessage({
              id: 'gpuservice.instanceType.unitCpu.tip'
            })}
            required
          />
        </Form.Item>

        <Form.Item<FormData>
          name={['spec', 'unitResources', 'ram']}
          normalize={giNormalize}
          getValueProps={giValueProps}
          rules={[
            {
              required: true,
              message: getRuleMessage(
                'input',
                'gpuservice.instanceType.unitRam'
              )
            }
          ]}
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            label={`${intl.formatMessage({
              id: 'gpuservice.instanceType.unitRam'
            })} (GB)`}
            description={intl.formatMessage({
              id: 'gpuservice.instanceType.unitRam.tip'
            })}
            required
          />
        </Form.Item>

        <Form.Item<FormData>
          name={['spec', 'localStorage']}
          normalize={giNormalize}
          getValueProps={giValueProps}
          rules={[
            {
              required: true,
              message: getRuleMessage(
                'input',
                'gpuservice.instanceType.localStorage'
              )
            }
          ]}
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            label={`${intl.formatMessage({
              id: 'gpuservice.instanceType.localStorage'
            })} (GB)`}
            description={intl.formatMessage({
              id: 'gpuservice.instanceType.localStorage.tip'
            })}
            required
          />
        </Form.Item>
      </Form>
    );
  }
);

export default GPUServiceInstanceTypeForm;
