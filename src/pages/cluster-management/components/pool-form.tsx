import {
  regionInstanceTypeListAtom,
  regionOSImageListAtom
} from '@/atoms/clusters';
import CollapsibleContainer, {
  CollapsibleContainerProps
} from '@/components/collapse-container';
import IconFont from '@/components/icon-font';
import LabelSelector from '@/components/label-selector';
import AutoComplete from '@/components/seal-form/auto-complete';
import SealInputNumber from '@/components/seal-form/input-number';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import { CardContainer } from '@/pages/llmodels/components/gpu-card';
import { DeleteOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Form } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from 'react';
import styled from 'styled-components';
import { ProviderType, instanceTypeFieldMap, vendorIconMap } from '../config';
import { NodePoolFormData as FormData } from '../config/types';
import VolumesConfig from './volumes-config';

const Container = styled.div`
  pointer-events: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 0 16px;
  .ant-form-item:nth-child(1) {
    grid-column: 1 / 3;
  }
  .ant-form-item:nth-child(2) {
    grid-column: 1 / 3;
  }
  .ant-form-item:nth-child(5) {
    grid-column: 1 / 3;
  }

  .ant-form-item:nth-child(6) {
    grid-column: 1 / 3;
  }
  .ant-form-item:nth-child(7) {
    grid-column: 1 / 3;
  }
`;

const NoContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-block: 12px;
`;

const OptionItem = styled.div.attrs({
  className: 'option-item'
})`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const DescriptionWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px 8px;
  font-weight: 400;
`;

const NotFoundContent = () => {
  const intl = useIntl();
  return (
    <NoContent>
      {intl.formatMessage({ id: 'clusters.create.noInstanceTypes' })}
    </NoContent>
  );
};

const NotFoundImageContent = () => {
  const intl = useIntl();
  return (
    <NoContent>
      {intl.formatMessage({ id: 'clusters.create.noImages' })}
    </NoContent>
  );
};

const RenderLabel = (data: {
  label: React.ReactNode;
  vendor: string;
  style?: React.CSSProperties;
}) => {
  const { label, vendor, style } = data;
  return (
    <div style={style} className="flex-center gap-8">
      <IconFont type={_.get(vendorIconMap, vendor, 'icon-gpu1')}></IconFont>
      {label}
    </div>
  );
};

export const RenderOption = (option: any) => {
  const { data = {}, styles } = option;
  const entries = Object.entries(data?.specInfo || {});
  return (
    <CardContainer
      key={data.value}
      header={
        <RenderLabel
          label={data.description || data.label}
          vendor={data.vendor}
          style={styles?.header}
        />
      }
      description={
        entries.length > 0 && (
          <DescriptionWrapper style={{ ...styles?.description }}>
            {Object.entries(data?.specInfo)
              .filter(([key, value]) => value)
              .map(([key, value]) => (
                <OptionItem key={key}>
                  <span className="label">
                    {_.get(instanceTypeFieldMap, key, key)}:
                  </span>
                  <span className="value">{value as string}</span>
                </OptionItem>
              ))}
          </DescriptionWrapper>
        )
      }
    />
  );
};

type AddModalProps = {
  ref: any;
  name?: string;
  action: PageActionType;
  provider: ProviderType; // 'kubernetes' | 'custom' | 'digitalocean';
  currentData?: FormData | null;
  onFinish: (values: FormData) => void;
  onDelete?: () => void;
  showDelete?: boolean;
  collapseProps?: CollapsibleContainerProps;
};

const InstanceSpecData: React.FC<{ instanceSpec: Record<string, any> }> = ({
  instanceSpec
}) => {
  return (
    <>
      {Object.entries(instanceSpec)
        .filter(([key, value]) => value)
        .map(([key, value]) => (
          <Form.Item key={key} name={['instance_spec', key]} hidden>
            <SealInput.Input />
          </Form.Item>
        ))}
    </>
  );
};

const PoolForm: React.FC<AddModalProps> = forwardRef((props, ref) => {
  const {
    action,
    name = 'workerPoolForm',
    onFinish,
    onDelete,
    showDelete,
    currentData,
    collapseProps
  } = props;
  const [instanceTypeList] = useAtom(regionInstanceTypeListAtom);
  const [osImageList] = useAtom(regionOSImageListAtom);
  const { collapsible, onToggle, ...restCollapseProps } = collapseProps || {};
  const [form] = Form.useForm();
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const labels = Form.useWatch('labels', form);
  const title = Form.useWatch('name', form);
  const [instanceSpec, setInstanceSpec] = useState<Record<string, any>>({});

  useEffect(() => {
    if (currentData) {
      form.setFieldsValue({
        ...currentData
      });
      setInstanceSpec({
        ...currentData.instance_spec
      });
    }
  }, [currentData]);

  const imageLabelRender = (data: {
    label: React.ReactNode;
    value: string | number;
  }) => {
    if (action === PageAction.EDIT) {
      const vendor = _.split(currentData?.image_name || '', ' ')[0];
      const iconType = _.get(vendorIconMap, vendor.toLowerCase());
      return (
        <div className="flex-center gap-8">
          {iconType && <IconFont type={iconType}></IconFont>}
          {currentData?.image_name || currentData?.os_image}
        </div>
      );
    }
    const selectImage = osImageList.find((item) => item.value === data.value);
    if (selectImage) {
      return (
        <RenderLabel label={data.label} vendor={selectImage.vendor || ''} />
      );
    }
    return data.value;
  };

  const instanceLabelRender = (data: {
    label: React.ReactNode;
    value: string | number;
  }) => {
    const currentInstanceSpec =
      instanceTypeList.find((item) => item.value === data.value) ||
      instanceSpec;
    return (
      <RenderLabel
        label={data.label || currentInstanceSpec?.label || data.value}
        vendor={currentInstanceSpec?.vendor || ''}
      />
    );
  };

  const handleOsImageChange = (value: string) => {
    form.setFieldsValue({
      image_name:
        osImageList.find((item) => item.value === value)?.label || value
    });
  };

  const handleInstanceTypeChange = (value: string, option: any) => {
    setInstanceSpec({
      ...option.specInfo,
      label: option.label,
      vendor: option.vendor,
      description: option.description
    });
    form.setFieldsValue({
      instance_spec: {
        ...option.specInfo,
        label: option.label,
        vendor: option.vendor,
        description: option.description
      }
    });
  };

  const filterInstanceOption = (inputValue: string, option: any) => {
    return (
      option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.description.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  useImperativeHandle(ref, () => ({
    resetFields: () => {
      form.resetFields();
    },
    submit: () => {
      form.submit();
    },
    setFieldsValue: (values: any) => {
      form.setFieldsValue(values);
    },
    getFieldsValue: () => {
      return form.getFieldsValue();
    },
    validateFields: async () => {
      return await form.validateFields();
    }
  }));

  return (
    <CollapsibleContainer
      {...restCollapseProps}
      title={title}
      collapsible={collapsible}
      onToggle={onToggle}
      deleteBtn={
        showDelete && (
          <Button
            onClick={onDelete}
            icon={<DeleteOutlined />}
            danger
            type="text"
            variant="filled"
            color="danger"
            size="small"
          ></Button>
        )
      }
    >
      <Form
        name={name}
        form={form}
        onFinish={onFinish}
        preserve={false}
        scrollToFirstError={true}
        initialValues={{
          replicas: 1,
          batch_size: 1
        }}
      >
        <Container>
          <Form.Item<FormData>
            name="name"
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'common.table.name')
              }
            ]}
          >
            <SealInput.Input
              label={intl.formatMessage({
                id: 'common.table.name'
              })}
              required
            ></SealInput.Input>
          </Form.Item>
          <Form.Item<FormData>
            name="instance_type"
            rules={[
              {
                required: true,
                message: getRuleMessage(
                  'input',
                  'clusters.workerpool.instanceType'
                )
              }
            ]}
          >
            <SealSelect
              showSearch
              filterOption={filterInstanceOption}
              labelRender={instanceLabelRender}
              notFoundContent={<NotFoundContent />}
              label={intl.formatMessage({
                id: 'clusters.workerpool.instanceType'
              })}
              required
              options={instanceTypeList}
              disabled={action === PageAction.EDIT}
              optionRender={RenderOption}
              onChange={handleInstanceTypeChange}
            ></SealSelect>
          </Form.Item>
          <Form.Item<FormData>
            name="replicas"
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'clusters.workerpool.replicas')
              }
            ]}
          >
            <SealInputNumber
              label={intl.formatMessage({
                id: 'clusters.workerpool.replicas'
              })}
              required
            ></SealInputNumber>
          </Form.Item>
          <Form.Item<FormData>
            name="batch_size"
            rules={[
              {
                required: true,
                message: getRuleMessage(
                  'input',
                  'clusters.workerpool.batchSize'
                )
              }
            ]}
          >
            <SealInputNumber
              description={intl.formatMessage({
                id: 'clusters.workerpool.batchSize.desc'
              })}
              label={intl.formatMessage({
                id: 'clusters.workerpool.batchSize'
              })}
              required
            ></SealInputNumber>
          </Form.Item>

          <Form.Item<FormData>
            name="os_image"
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'clusters.workerpool.osImage')
              }
            ]}
          >
            <AutoComplete
              showSearch
              allowClear
              onChange={handleOsImageChange}
              optionRender={(option) =>
                RenderOption({
                  ...option,
                  styles: { header: { marginBlock: 5 } }
                })
              }
              labelRender={imageLabelRender}
              placeholder={currentData?.image_name}
              options={osImageList}
              disabled={action === PageAction.EDIT}
              label={intl.formatMessage({
                id: 'clusters.workerpool.osImage'
              })}
              required
            ></AutoComplete>
          </Form.Item>

          <Form.Item<FormData>
            name="labels"
            rules={[
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (_.keys(value).length > 0) {
                    if (_.some(_.keys(value), (k: string) => !value[k])) {
                      return Promise.reject(
                        intl.formatMessage(
                          {
                            id: 'common.validate.value'
                          },
                          {
                            name: 'labels'
                          }
                        )
                      );
                    }
                  }
                  return Promise.resolve();
                }
              })
            ]}
          >
            <LabelSelector
              disabled={action === PageAction.EDIT}
              label={intl.formatMessage({ id: 'resources.table.labels' })}
              labels={labels || {}}
              btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
            ></LabelSelector>
          </Form.Item>
          <VolumesConfig disabled={action === PageAction.EDIT}></VolumesConfig>
          <Form.Item<FormData> name="image_name" hidden>
            <SealInput.Input></SealInput.Input>
          </Form.Item>
          <InstanceSpecData instanceSpec={instanceSpec} />
        </Container>
      </Form>
    </CollapsibleContainer>
  );
});

export default PoolForm;
