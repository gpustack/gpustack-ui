import { validateLabelNameRegxFor63 } from '@/config';
import {
  AutoTooltip,
  Input as CInput,
  InputNumber,
  Select as SealSelect,
  ThemeTag,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form } from 'antd';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { formatMemoryDisplay } from '../../instances/config';
import { manufactureColorMap } from '../../templates/config';
import { formatManufacturer } from '../../utils';
import { ArchOptions, GPU_INSTANCE_TYPE_OS } from '../config';
import { FlavorItem, FormData } from '../config/types';
import styles from '../styles/instance-types.module.less';

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
  // The flavor picked from the flavor Select. Its acceleratorGroup /
  // generalGroup / acceleratable are copied into the created instance type.
  selectedFlavor?: FlavorItem | null;
  flavorList: FlavorItem[];
  flavorLoading?: boolean;
  onFlavorChange: (flavor: FlavorItem | null) => void;
  onFinish: (values: FormData) => Promise<void>;
  onFinishFailed?: (errorInfo: any) => void;
}

// A flavor's title mirrors the flavor card: a generic (no product, no/`generic`
// manufacturer, non-acceleratable) flavor reads as "CPU-only".
const getFlavorTitle = (flavor: FlavorItem) => {
  const spec = flavor.spec || {};
  const manufacturer = spec.manufacturer || '';
  const isCpuOnly =
    !spec.acceleratable &&
    !spec.product &&
    (!manufacturer || manufacturer.toLowerCase() === 'generic');
  return isCpuOnly ? 'CPU-only' : spec.product || flavor.name || '-';
};

const GPUServiceInstanceTypeForm: React.FC<InstanceTypeFormProps> = forwardRef(
  (props, ref) => {
    const {
      open,
      selectedFlavor,
      flavorList,
      flavorLoading,
      onFlavorChange,
      onFinish,
      onFinishFailed
    } = props;
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

    // A flavor's dropdown / selected label shows the same info as the flavor
    // Secondary line, dot-separated: manufacturer · memory · sliceable. memory
    // and sliceable apply to accelerator (GPU) flavors only; sliceable stays a
    // tag. Returns null when a (generic) flavor has nothing to show.
    const renderFlavorMeta = (flavor: FlavorItem) => {
      const spec = flavor.spec || {};
      const manufacturer = spec.manufacturer || '';
      const color = manufactureColorMap[manufacturer] ?? 'purple';
      const memory = spec.acceleratable
        ? formatMemoryDisplay(spec.memory ?? undefined)
        : '';

      const pieces: React.ReactNode[] = [];
      if (manufacturer) {
        pieces.push(
          <ThemeTag
            key="vendor"
            color={color}
            style={{ fontWeight: 400, marginInlineEnd: 0 }}
          >
            {formatManufacturer(manufacturer)}
          </ThemeTag>
        );
      }
      if (memory) {
        pieces.push(<span key="memory">{memory}</span>);
      }
      if (spec.acceleratable && spec.sliceable) {
        pieces.push(
          <ThemeTag
            key="sliceable"
            color="geekblue"
            style={{ fontWeight: 400, marginInlineEnd: 0 }}
          >
            {intl.formatMessage({ id: 'gpuservice.instance.sliceable' })}
          </ThemeTag>
        );
      }
      if (!pieces.length) return null;

      return (
        <Flex
          align="center"
          gap={8}
          style={{
            minWidth: 0,
            color: 'var(--ant-color-text-tertiary)',
            fontSize: 12
          }}
        >
          {pieces.flatMap((piece, index) =>
            index === 0
              ? [piece]
              : [
                  <span
                    key={`dot-${index}`}
                    style={{ color: 'var(--ant-color-text-quaternary)' }}
                  >
                    ·
                  </span>,
                  piece
                ]
          )}
        </Flex>
      );
    };

    // Dropdown item: two lines — name on top, meta row below.
    const renderFlavorOption = (flavor: FlavorItem) => (
      <Flex vertical gap={4} style={{ minWidth: 0, padding: '2px 0' }}>
        <AutoTooltip ghost minWidth={20} maxWidth={'100%'}>
          {getFlavorTitle(flavor)}
        </AutoTooltip>
        {renderFlavorMeta(flavor)}
      </Flex>
    );

    // Collapsed selected value: single line — name then meta inline.
    const renderFlavorSelected = (flavor: FlavorItem) => (
      <Flex align="center" gap={8} style={{ minWidth: 0 }}>
        <AutoTooltip ghost minWidth={20} maxWidth={200}>
          {getFlavorTitle(flavor)}
        </AutoTooltip>
        {renderFlavorMeta(flavor)}
      </Flex>
    );

    // Split flavors into two groups: CPU compute (generic) and GPU compute
    // (accelerator). Groups render as labeled sections in the dropdown.
    const toFlavorOption = (flavor: FlavorItem) => ({
      value: flavor.name,
      label: getFlavorTitle(flavor),
      flavor
    });
    const cpuFlavors = flavorList.filter((flavor) => !flavor.spec?.acceleratable);
    const gpuFlavors = flavorList.filter((flavor) => flavor.spec?.acceleratable);
    const flavorOptions = [
      cpuFlavors.length && {
        label: intl.formatMessage({
          id: 'gpuservice.instanceType.flavor.cpuGroup'
        }),
        title: 'cpu',
        options: cpuFlavors.map(toFlavorOption)
      },
      gpuFlavors.length && {
        label: intl.formatMessage({
          id: 'gpuservice.instanceType.flavor.gpuGroup'
        }),
        title: 'gpu',
        options: gpuFlavors.map(toFlavorOption)
      }
    ].filter(Boolean) as any;

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
          <SealSelect
            label={intl.formatMessage({ id: 'gpuservice.instanceType.flavor' })}
            required
            showSearch
            optionFilterProp="label"
            classNames={{ popup: { root: styles.flavorDropdown } }}
            loading={flavorLoading}
            value={selectedFlavor?.name}
            options={flavorOptions}
            onChange={(val: string) =>
              onFlavorChange(
                flavorList.find((flavor) => flavor.name === val) ?? null
              )
            }
            optionRender={(option: any) =>
              renderFlavorOption(option.data.flavor)
            }
            labelRender={({ value }) => {
              const flavor = flavorList.find((item) => item.name === value);
              return flavor
                ? renderFlavorSelected(flavor)
                : ((value ?? '') as React.ReactNode);
            }}
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
