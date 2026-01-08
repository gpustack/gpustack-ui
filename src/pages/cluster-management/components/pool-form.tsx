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
import { useMemoizedFn } from 'ahooks';
import { Button, Form } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
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
      if (action === PageAction.CREATE) {
        // when change the region, shoudle check the instance type and the os Image.
        const selectOSImage = osImageList.find(
          (item) => item.os_image === currentData.os_image
        );
        const selectInstanceType = instanceTypeList.find(
          (item) => item.value === currentData.instance_type
        );

        form.setFieldsValue({
          ...currentData,
          instance_type: selectInstanceType?.value || '',
          os_image: selectOSImage?.os_image || '',
          image_name: selectOSImage?.value || ''
        });

        setInstanceSpec(() => {
          return selectInstanceType ? currentData.instance_spec : {};
        });
      } else if (action === PageAction.EDIT) {
        form.setFieldsValue({
          ...currentData
        });

        setInstanceSpec(() => {
          return currentData.instance_spec || {};
        });
      }
    }
  }, [currentData, instanceTypeList, osImageList, action]);

  const updateImageList = useMemoizedFn((instanceSpec: Record<string, any>) => {
    if (instanceSpec.count === 8) {
      return osImageList.filter((item) => item.os_image === 'gpu-h100x8-base');
    }

    if (instanceSpec.count === 1 && instanceSpec.vendor === 'amd') {
      return osImageList.filter((item) => item.os_image === 'gpu-amd-base');
    }

    if (instanceSpec.count === 1 && instanceSpec.vendor === 'nvidia') {
      return osImageList.filter((item) => item.os_image === 'gpu-h100x1-base');
    }

    return osImageList;
  });

  const imageList = useMemo(() => {
    return updateImageList(instanceSpec);
  }, [osImageList, instanceSpec, updateImageList]);

  const instanceLabelRender = (data: {
    label: React.ReactNode;
    value: string | number;
  }) => {
    const currentInstanceSpec =
      instanceTypeList.find((item) => item.value === data.value) ||
      instanceSpec;

    if (!currentInstanceSpec || _.isEmpty(currentInstanceSpec)) {
      return null;
    }
    return (
      <RenderLabel
        label={data.label || currentInstanceSpec?.label || data.value}
        vendor={currentInstanceSpec?.vendor || ''}
      />
    );
  };

  const handleOsImageChange = (value: string, option: any) => {
    form.setFieldsValue({
      os_image: option?.os_image || value
    });
  };

  const handleInstanceTypeChange = (value: string, option: any) => {
    const newInstanceSpec = {
      ...option.specInfo,
      label: option.label,
      vendor: option.vendor,
      description: option.description,
      count: option.count
    };
    setInstanceSpec({ ...newInstanceSpec });

    const newImageList = updateImageList({ ...newInstanceSpec });

    form.setFieldsValue({
      os_image: newImageList[0]?.os_image,
      image_name: newImageList[0]?.value,
      instance_spec: { ...newInstanceSpec }
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
      styles={{
        root: {
          background: 'unset'
        }
      }}
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
              showSearch={{
                filterOption: filterInstanceOption
              }}
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
            name="image_name"
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
              options={imageList}
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
                            name: intl.formatMessage({
                              id: 'resources.table.labels'
                            })
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
              label={intl.formatMessage({ id: 'resources.table.labels' })}
              labels={labels || {}}
              btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
            ></LabelSelector>
          </Form.Item>
          <VolumesConfig disabled={action === PageAction.EDIT}></VolumesConfig>
          <Form.Item<FormData> name="os_image" hidden>
            <SealInput.Input></SealInput.Input>
          </Form.Item>
          <InstanceSpecData instanceSpec={instanceSpec} />
        </Container>
      </Form>
    </CollapsibleContainer>
  );
});

export default PoolForm;
