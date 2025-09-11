import {
  regionInstanceTypeListAtom,
  regionOSImageListAtom
} from '@/atoms/clusters';
import CollapsibleContainer, {
  CollapsibleContainerProps
} from '@/components/collapse-container';
import IconFont from '@/components/icon-font';
import LabelSelector from '@/components/label-selector';
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
  gap: 8px;
  font-weight: 400;
`;

const NotFoundContent = () => {
  return <NoContent>No instance type available</NoContent>;
};

export const RenderInstanceOption = (option: any) => {
  const { data, styles } = option;

  return (
    <CardContainer
      key={data.value}
      header={
        <span>
          <IconFont
            type={_.get(vendorIconMap, data.vendor, 'icon-gpu1')}
            className="m-r-8"
          ></IconFont>
          {data.description}
        </span>
      }
      description={
        <DescriptionWrapper style={{ ...(styles?.description || {}) }}>
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

  const labelRender = (data: { label: string; value: string }) => {
    if (action === PageAction.EDIT) {
      return currentData?.image_name || currentData?.os_image;
    }
    return data.label;
  };

  const instanceLabelRender = (data: { label: string; value: string }) => {
    if (action === PageAction.EDIT) {
      return currentData?.instance_spec?.label || currentData?.instance_type;
    }
    return data.label;
  };

  const handleOsImageChange = (value: string) => {
    form.setFieldsValue({
      image_name: osImageList.find((item) => item.value === value)?.label
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
              optionRender={RenderInstanceOption}
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
            <SealSelect
              showSearch
              onChange={handleOsImageChange}
              optionRender={RenderInstanceOption}
              labelRender={labelRender}
              options={osImageList}
              disabled={action === PageAction.EDIT}
              label={intl.formatMessage({
                id: 'clusters.workerpool.osImage'
              })}
              required
            ></SealSelect>
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
