import { LabelSelectorContext } from '@/components/label-selector/context';
import MetadataList from '@/components/metadata-list';
import SealCascader from '@/components/seal-form/seal-cascader';
import SealInput from '@/components/seal-form/seal-input';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { useState } from 'react';
import { FormData } from '../config/types';

const providerModelList = [
  {
    label: 'Deployments',
    value: 'deployments',
    children: [
      {
        label: 'qwen3-0.6b',
        value: 'qwen3-0.6b',
        key: '1',
        provider_id: 1,
        model_id: 101
      },
      {
        label: 'deepseek',
        value: 'deepseek',
        key: '2',
        provider_id: 1,
        model_id: 102
      }
    ]
  },
  {
    label: 'Doubao',
    value: 'doubao',
    children: [
      {
        label: 'qwen3-0.6b',
        value: 'qwen3-0.6b',
        key: '3',
        provider_id: 2,
        model_id: 201
      },
      {
        label: 'deepseek',
        value: 'deepseek',
        key: '4',
        provider_id: 2,
        model_id: 202
      }
    ]
  }
];

const Endpoints = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const endpoints = Form.useWatch('endpoints', form);
  const [dataList, setDataList] = useState<
    {
      provider_model_name: string;
      weight: number;
      model_id: number;
      provider_id: number;
    }[]
  >(endpoints || []);

  const handleEndpointsChange = (labels: Record<string, any>) => {
    form.setFieldValue('endpoints', labels);
  };

  const handleOnAdd = () => {
    const newDataList = [
      ...dataList,
      {
        provider_model_name: '',
        weight: 1,
        model_id: 0,
        provider_id: 0
      }
    ];
    setDataList(newDataList);
  };

  const handleOnDelete = (index: number, item: any) => {
    const newDataList = dataList.filter((_, i) => i !== index);
    setDataList(newDataList);
  };

  return (
    <>
      <LabelSelectorContext.Provider
        value={{
          placeholder: ['Model', 'Weight'],
          options: [
            {
              label: 'max_token_len',
              value: 'max_token_len'
            },
            {
              label: 'max_context_len',
              value: 'max_context_len'
            }
          ]
        }}
      >
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
            label={'Endpoints'}
            dataList={dataList}
            btnText="Add Endpoint"
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
                  classNames={{
                    popup: {
                      root: 'cascader-popup-wrapper gpu-selector'
                    }
                  }}
                  maxTagCount={1}
                  placeholder="provider/model"
                  options={providerModelList}
                  showCheckedStrategy="SHOW_CHILD"
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                ></SealCascader>
                <span className="seprator">:</span>
                <SealInput.Number
                  style={{ flex: 60 }}
                  placeholder="weight"
                ></SealInput.Number>
              </>
            )}
          </MetadataList>
        </Form.Item>
      </LabelSelectorContext.Provider>
    </>
  );
};

export default Endpoints;
