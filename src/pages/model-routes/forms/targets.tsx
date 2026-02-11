import AutoTooltip from '@/components/auto-tooltip';
import MetadataList from '@/components/metadata-list';
import InputNumber from '@/components/seal-form/input-number';
import SealCascader from '@/components/seal-form/seal-cascader';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import ProviderLogo from '@/pages/maas-provider/components/provider-logo';
import { useIntl } from '@umijs/max';
import { Form, Tooltip } from 'antd';
import _ from 'lodash';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import useTargetSourceModels from '../hooks/use-target-source-models';

const OptionWrapper = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LabelWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TargetsForm = forwardRef((props, ref) => {
  const { onFallbackChange, action } = useFormContext();
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const { sourceModels, fetchSourceModels } = useTargetSourceModels();
  const [validTriggered, setValidTriggered] = useState<boolean>(false);
  const form = Form.useFormInstance<FormData>();
  const targets = Form.useWatch('targets', form) || [];
  const fallbackCacheRef = useRef<{ value: any[] }>({ value: [] });
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
      fallbackCacheRef.current = values;
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
      weight: targetList[index]?.weight,
      ...selectedOption?.data
    };

    form.setFieldValue('targets', [...targetList]);

    const newDataList = [...dataList];
    newDataList[index] = {
      weight: newDataList[index]?.weight || null,
      value: value
    };
    form.validateFields(['targets']);
    setDataList(newDataList);
  };

  const handleOnAdd = () => {
    const newDataList = [
      ...dataList,
      {
        weight: 100,
        value: []
      }
    ];
    setDataList(newDataList);
    const newTargets = [
      ...targets,
      {
        weight: 100,
        value: []
      }
    ];

    form.setFieldValue('targets', newTargets);
  };

  const handleOnDelete = (index: number, item: any) => {
    const newDataList = dataList.filter((_, i) => i !== index);
    setDataList(newDataList);

    const targetList = [...targets];
    targetList.splice(index, 1);
    form.setFieldValue('targets', [...targetList]);
  };

  const handleFallbackChange = (value: any[], options?: any[]) => {
    if (!value || value.length === 0) {
      form.setFieldValue('fallback_target', null);
      setFallbackValues({
        value: []
      });
      return;
    }
    const selectedOption =
      options?.find?.((opt) => opt.value === value[1]) || {};

    form.setFieldValue('fallback_target', {
      ...selectedOption?.data
    });
    setFallbackValues({
      value: value
    });
    if (action === PageAction.EDIT) {
      const isEqual = _.isEqual(fallbackCacheRef.current.value, value);
      onFallbackChange?.(!isEqual);
    }
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
    form.validateFields(['targets']);
    setDataList(newDataList);
  };

  const buildKey = (path?: any[]) =>
    Array.isArray(path) ? path.join('/') : '';

  const filterOptions = (currentValue: any[]) => {
    const currKey = buildKey(currentValue);

    const selectedDataList = [...dataList, { value: fallbackValues.value }];

    const selectedKeys = new Set(
      selectedDataList
        .filter((item) => item.value)
        .map((item) => buildKey(item.value))
    );

    return sourceModels
      .map((model) => {
        const children = model.children?.filter((child) => {
          const key = buildKey([child.data?.parentId, child.value]);

          return !selectedKeys.has(key) || key === currKey;
        });

        return {
          ...model,
          children
        };
      })
      .filter((model) => model.children && model.children.length > 0);
  };

  const displayRender = (labels: any[], option: any) => {
    return (
      <LabelWrapper>
        <ProviderLogo provider={_.get(option, '0.providerType') as string} />
        <AutoTooltip
          ghost
          maxWidth={300}
          title={
            <span>
              {labels[0]} / {labels[1]}
            </span>
          }
        >
          <span>
            {labels[0]} / {labels[1]}
          </span>
        </AutoTooltip>
      </LabelWrapper>
    );
  };

  const optionRender = (option: any) => {
    const { data } = option;

    if (!data.isParent) {
      return <AutoTooltip ghost>{data.label}</AutoTooltip>;
    }

    if (data.providerType === 'deployments') {
      return (
        <OptionWrapper>
          <ProviderLogo provider={data.providerType as string} />
          <AutoTooltip ghost maxWidth={105}>
            {intl.formatMessage({ id: 'menu.models.deployment' })}
          </AutoTooltip>
        </OptionWrapper>
      );
    }

    return (
      <OptionWrapper>
        <ProviderLogo provider={data.providerType as string} />
        <AutoTooltip ghost maxWidth={105}>
          <span>{data.label}</span>
        </AutoTooltip>
      </OptionWrapper>
    );
  };

  useEffect(() => {
    fetchSourceModels();
  }, []);

  useEffect(() => {
    if (action === PageAction.CREATE) {
      handleOnAdd();
    }
  }, [action]);

  return (
    <>
      <Form.Item
        name="targets"
        data-field="targets"
        trigger=""
        rules={[
          {
            validator(rule, value) {
              if (value && value?.length > 0) {
                if (_.some(value, (item: any) => !item.weight)) {
                  setValidTriggered(true);
                  return Promise.reject(
                    getRuleMessage('input', 'routes.form.target.weight')
                  );
                }

                if (
                  _.some(
                    dataList,
                    (item: any) => !item.value || item.value.length === 0
                  )
                ) {
                  setValidTriggered(true);
                  return Promise.reject(
                    getRuleMessage('input', 'providers.form.target.placeholder')
                  );
                }
              }
              setValidTriggered(false);
              return Promise.resolve();
            }
          }
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
                status={
                  (!item.value || item.value.length === 0) && validTriggered
                    ? 'error'
                    : 'success'
                }
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
                styles={{
                  popup: {
                    listItem: {
                      padding: '5px 10px'
                    }
                  }
                }}
                maxTagCount={1}
                placeholder={intl.formatMessage({
                  id: 'providers.form.target.placeholder'
                })}
                value={item.value}
                options={filterOptions(item.value)}
                showCheckedStrategy="SHOW_CHILD"
                displayRender={displayRender}
                optionNode={optionRender}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
              ></SealCascader>
              <span className="seprator">:</span>
              <Tooltip
                title={intl.formatMessage({
                  id: 'routes.form.weight.tips'
                })}
              >
                <span>
                  <InputNumber
                    style={{ flex: 100 }}
                    min={0}
                    step={1}
                    status={
                      item.weight === null && validTriggered
                        ? 'error'
                        : 'success'
                    }
                    value={item.weight}
                    onChange={(value) => handleOnWeightChange(value, index)}
                    placeholder={intl.formatMessage({
                      id: 'routes.form.target.weight'
                    })}
                  ></InputNumber>
                </span>
              </Tooltip>
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
            styles={{
              popup: {
                listItem: {
                  padding: '5px 10px'
                }
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
            options={filterOptions(fallbackValues.value)}
            onChange={(value, options) => handleFallbackChange(value, options)}
            showCheckedStrategy="SHOW_CHILD"
            displayRender={displayRender}
            optionNode={optionRender}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
          ></SealCascader>
        </div>
      </Form.Item>
    </>
  );
});

export default TargetsForm;
