import MetadataList from '@/components/metadata-list';
import SealCascader from '@/components/seal-form/seal-cascader';
import SealInput from '@/components/seal-form/seal-input';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import styled from 'styled-components';
import { FormData } from '../config/types';
import useTargetSourceModels from '../hooks/use-target-source-models';

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

const TargetsForm = forwardRef((props, ref) => {
  const intl = useIntl();
  const { sourceModels, loading, fetchSourceModels } = useTargetSourceModels();
  const form = Form.useFormInstance<FormData>();
  const targets = Form.useWatch('targets', form) || [];
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

  const handleTargetsChange = (value: any[], index: number, options: any[]) => {
    const selectedOption =
      options?.find?.((opt) => opt.value === value[1]) || {};
    const targetList = [...targets];
    targetList[index] = {
      weight: targetList[index]?.weight || null,
      ...selectedOption?.data
    };

    form.setFieldValue('targets', [...targetList]);

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

    const targetList = [...targets];
    targetList.splice(index, 1);
    form.setFieldValue('targets', [...targetList]);
  };

  const handleFallbackChange = (value: any[], options?: any[]) => {
    const selectedOption =
      options?.find?.((opt) => opt.value === value[1]) || {};

    console.log('fallback selected option data:', value);
    form.setFieldValue('fallback_target', {
      ...selectedOption?.data
    });
    setFallbackValues({
      value: value
    });
  };

  const handleOnWeightChange = (value: any, index: number) => {
    const targetList = [...targets];
    if (targetList[index]) {
      targetList[index] = {
        ...targetList[index],
        weight: value
      };
      form.setFieldValue('targets', [...targetList]);
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
        name="targets"
        data-field="targets"
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
          btnText={intl.formatMessage({ id: 'routes.form.target.add' })}
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
                  handleTargetsChange(value, index, options)
                }
                classNames={{
                  popup: {
                    root: 'cascader-popup-wrapper gpu-selector'
                  }
                }}
                maxTagCount={1}
                placeholder={intl.formatMessage({
                  id: 'providers.form.target.placeholder'
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
                  id: 'routes.form.target.weight'
                })}
              ></SealInput.Number>
            </>
          )}
        </MetadataList>
      </Form.Item>
      <Form.Item name="fallback_target">
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
              id: 'routes.form.target.fallback'
            })}
            placeholder={intl.formatMessage({
              id: 'providers.form.target.placeholder'
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

export default TargetsForm;
