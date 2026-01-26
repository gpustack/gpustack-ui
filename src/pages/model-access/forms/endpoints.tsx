import MetadataList from '@/components/metadata-list';
import SealCascader from '@/components/seal-form/seal-cascader';
import SealInput from '@/components/seal-form/seal-input';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import styled from 'styled-components';
import { FormData } from '../config/types';
import useEndpointSourceModels from '../hooks/use-endpoint-source-models';

const Inner = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  ul.ant-cascader-menu:first-child {
    li[data-path-key='deployments'] {
      position: relative;
      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        border-bottom: 1px solid var(--ant-color-split);
      }
    }
  }
`;

const EndpointsForm = forwardRef((props, ref) => {
  const intl = useIntl();
  const { sourceModels, loading, fetchSourceModels } =
    useEndpointSourceModels();
  const form = Form.useFormInstance<FormData>();
  const endpoints = Form.useWatch('endpoints', form) || [];
  const [fallbackValues, setFallbackValues] = useState<{ value: any[] }>({
    value: []
  });
  const [dataList, setDataList] = useState<
    {
      weight: number | null;
      value: any[];
    }[]
  >([]);

  useImperativeHandle(ref, () => ({
    initFallbackValues: (values: { value: any[] }) => {
      setFallbackValues(values);
    },
    initDataList: (
      list: {
        weight: number | null;
        value: any[];
      }[]
    ) => {
      setDataList(list);
    }
  }));

  const handleEndpointsChange = (
    value: any[],
    index: number,
    options: any[]
  ) => {
    const selectedOption =
      options?.find?.((opt) => opt.value === value[1]) || {};
    const endpointList = [...endpoints];
    endpointList[index] = {
      weight: endpointList[index]?.weight || null,
      ...selectedOption?.data
    };

    form.setFieldValue('endpoints', [...endpointList]);

    const newDataList = [...dataList];
    newDataList[index] = {
      weight: newDataList[index]?.weight || null,
      value: value
    };
    setDataList(newDataList);
  };

  const handleOnAdd = () => {
    const newDataList = [
      ...dataList,
      {
        weight: null,
        value: []
      }
    ];
    setDataList(newDataList);
  };

  const handleOnDelete = (index: number, item: any) => {
    const newDataList = dataList.filter((_, i) => i !== index);
    setDataList(newDataList);

    const endpointList = [...endpoints];
    endpointList.splice(index, 1);
    form.setFieldValue('endpoints', [...endpointList]);
  };

  const handleFallbackChange = (value: any[], options?: any[]) => {
    const selectedOption =
      options?.find?.((opt) => opt.value === value[1]) || {};

    console.log('fallback selected option data:', value);
    form.setFieldValue('fallback_endpoint', {
      ...selectedOption?.data
    });
    setFallbackValues({
      value: value
    });
  };

  const handleOnWeightChange = (value: any, index: number) => {
    const endpointList = [...endpoints];
    if (endpointList[index]) {
      endpointList[index] = {
        ...endpointList[index],
        weight: value
      };
      form.setFieldValue('endpoints', [...endpointList]);
    }

    const newDataList = [...dataList];
    newDataList[index] = {
      ...newDataList[index],
      weight: value
    };
    setDataList(newDataList);
  };

  useEffect(() => {
    fetchSourceModels();
  }, []);

  return (
    <>
      <Form.Item
        name="endpoints"
        data-field="endpoints"
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
                          id: 'models.form.selector'
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
        <MetadataList
          label={''}
          styles={{
            wrapper: {
              paddingTop: 14
            }
          }}
          dataList={dataList}
          btnText={intl.formatMessage({ id: 'accesses.form.endpoint.add' })}
          onAdd={handleOnAdd}
          onDelete={handleOnDelete}
        >
          {(item, index) => (
            <>
              <SealCascader
                required
                showSearch
                expandTrigger="hover"
                multiple={false}
                alwaysFocus={true}
                onChange={(value, options) =>
                  handleEndpointsChange(value, index, options)
                }
                classNames={{
                  popup: {
                    root: 'cascader-popup-wrapper gpu-selector'
                  }
                }}
                maxTagCount={1}
                placeholder={intl.formatMessage({
                  id: 'providers.form.endpoint.placeholder'
                })}
                value={item.value}
                options={sourceModels}
                showCheckedStrategy="SHOW_CHILD"
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
              ></SealCascader>
              <span className="seprator">:</span>
              <SealInput.Number
                style={{ flex: 100 }}
                min={0}
                value={item.weight}
                onChange={(value) => handleOnWeightChange(value, index)}
                placeholder={intl.formatMessage({
                  id: 'accesses.form.endpoint.weight'
                })}
              ></SealInput.Number>
            </>
          )}
        </MetadataList>
      </Form.Item>
      <Form.Item name="fallback_endpoint">
        <div>
          <SealCascader
            showSearch
            expandTrigger="hover"
            multiple={false}
            alwaysFocus={true}
            classNames={{
              popup: {
                root: 'cascader-popup-wrapper gpu-selector'
              }
            }}
            label={intl.formatMessage({
              id: 'accesses.form.endpoint.fallback'
            })}
            placeholder={intl.formatMessage({
              id: 'providers.form.endpoint.placeholder'
            })}
            maxTagCount={1}
            value={fallbackValues.value}
            options={sourceModels}
            onChange={(value, options) => handleFallbackChange(value, options)}
            showCheckedStrategy="SHOW_CHILD"
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
          ></SealCascader>
        </div>
      </Form.Item>
    </>
  );
});

export default EndpointsForm;
