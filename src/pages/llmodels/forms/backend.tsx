import SealCascader from '@/components/seal-form/seal-cascader';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import { BackendSourceValueMap } from '@/pages/backends/config';
import { CaretDownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useIntl, useNavigate } from '@umijs/max';
import { Form, Select } from 'antd';
import React, { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { backendTipsList } from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { BackendOption } from '../config/types';

const CaretDownWrapper = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  &:hover {
    .anticon {
      color: var(--ant-color-text);
    }
  }
`;

const BackendFields: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const {
    action,
    onValuesChange,
    backendOptions,
    flatBackendOptions,
    onBackendChange
  } = useFormContext();
  const backend = Form.useWatch('backend', form);
  const [showDeprecated, setShowDeprecated] = React.useState<boolean>(false);
  const [selectedBackend, setSelectedBackend] =
    React.useState<BackendOption | null>(null);

  const handleBackendVersionOnChange = (value: any) => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  const backendHelperText = useMemo(() => {
    const selected = flatBackendOptions?.find((item) => item.value === backend);
    if (
      selected &&
      !selected.enabled &&
      selected.backend_source === BackendSourceValueMap.COMMUNITY
    ) {
      return (
        <span style={{ color: 'var(--ant-color-error)' }}>
          {intl.formatMessage({ id: 'models.form.backend.helperText' })}
        </span>
      );
    }
    return null;
  }, [backend, flatBackendOptions, intl]);

  const backendVersions = useMemo((): {
    builtIn: any[];
    custom: any[];
    deprecated: any[];
  } => {
    if (!backend || backend === backendOptionsMap.custom) {
      return {
        builtIn: [],
        custom: [],
        deprecated: []
      };
    }

    const versions = selectedBackend?.versions || [];

    // if it's a custom backend,
    if (selectedBackend && !selectedBackend.isBuiltIn) {
      return {
        builtIn: [],
        custom: versions.filter((item) => !item.is_deprecated),
        deprecated: versions.filter((item) => item.is_deprecated)
      };
    }

    // check the value if endts with '-custom', if true, remove the suffix  add to  "Cutom" group, if not , add to "Built-in" group

    // ============ Built-in Versions ============
    const builtInVersions = versions.filter(
      (item) => !item.value?.endsWith('-custom') && !item.is_deprecated
    );

    // ============ Custom Versions ============
    const customVersions = versions.filter(
      (item) => item.value?.endsWith('-custom') && !item.is_deprecated
    );

    // ============ Deprecated Versions ============
    const deprecatedVersions = versions.filter((item) => item.is_deprecated);

    return {
      builtIn: builtInVersions,
      custom: customVersions,
      deprecated: deprecatedVersions
    };
  }, [backend, selectedBackend, intl]);

  const backendVersionLabelRender = (option: any) => {
    console.log('backendVersionLabelRender option:', option);
    return option.title;
  };

  const renderVersionOptions = (values: any[], label: string) => {
    if (!values || values.length === 0) {
      return null;
    }
    return (
      <Select.OptGroup label={label}>
        {values.map((item) => (
          <Select.Option key={item.value} value={item.value} label={item.label}>
            {item.label}
          </Select.Option>
        ))}
      </Select.OptGroup>
    );
  };

  const handleOnBackendChange = (value: any[], option: any) => {
    form.setFieldValue('backend', value?.[1]);
    onBackendChange?.(value?.[1], option?.[1] || {});
    setSelectedBackend(option?.[1] || {});
  };

  const displayRender = (labels: any[], selectedOptions?: any[]) => {
    const groupTitle = selectedOptions?.[0]?.title;
    if (!groupTitle) {
      return <span>{labels?.[0]}</span>;
    }
    return (
      <span className="flex-center">
        {intl.formatMessage({ id: groupTitle })} / {labels?.[1]}
      </span>
    );
  };

  const renderDeprecatedVersionOptions = (values: any[]) => {
    if (!values || values.length === 0) {
      return null;
    }
    return (
      <Select.OptGroup
        label={
          <CaretDownWrapper onClick={() => setShowDeprecated(!showDeprecated)}>
            {intl.formatMessage({
              id: 'models.form.backendVersion.deprecated'
            })}
            <CaretDownOutlined rotate={showDeprecated ? 0 : -90} />
          </CaretDownWrapper>
        }
      >
        {showDeprecated &&
          values.map((item) => (
            <Select.Option
              key={item.value}
              value={item.value}
              label={item.label}
            >
              {item.label}
            </Select.Option>
          ))}
      </Select.OptGroup>
    );
  };

  const BackendNode = (props: any) => {
    const { data: backend } = props;
    return backend.isLeaf ? (
      <span className="flex-center">
        {backend.label}
        {backend.backend_source === BackendSourceValueMap.COMMUNITY &&
          !backend.enabled && (
            <span className="text-tertiary m-l-4">
              [{intl.formatMessage({ id: 'common.status.disabled' })}]
            </span>
          )}
      </span>
    ) : (
      <span>{intl.formatMessage({ id: backend.title })}</span>
    );
  };

  useEffect(() => {
    if (action === PageAction.EDIT) {
      const selected = flatBackendOptions?.find(
        (item) => item.value === backend
      );
      if (selected) {
        form.setFieldValue('backend_selection', [
          selected.backend_source,
          backend
        ]);
      }
    }
  }, [backend, flatBackendOptions, action]);

  return (
    <>
      <Form.Item name="backend" hidden>
        <SealInput.Input></SealInput.Input>
      </Form.Item>
      <Form.Item
        name="backend_selection"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'models.form.backend')
          }
        ]}
        help={backendHelperText}
      >
        <SealCascader
          required
          showSearch
          allowClear={false}
          changeOnSelect={false}
          expandTrigger="hover"
          multiple={false}
          classNames={{
            popup: {
              root: 'cascader-popup-wrapper gpu-selector'
            }
          }}
          maxTagCount={1}
          label={intl.formatMessage({ id: 'models.form.backend' })}
          options={backendOptions}
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
          optionNode={BackendNode}
          displayRender={displayRender}
          onChange={handleOnBackendChange}
        ></SealCascader>
      </Form.Item>
      {backendOptionsMap.custom !== backend && (
        <Form.Item name="backend_version">
          <SealSelect
            allowClear
            showSearch
            allowNull
            labelRender={backendVersionLabelRender}
            placeholder={intl.formatMessage({
              id: 'models.form.backendVersion.holder'
            })}
            description={<TooltipList list={backendTipsList}></TooltipList>}
            onChange={handleBackendVersionOnChange}
            label={intl.formatMessage({ id: 'models.form.backendVersion' })}
            footer={
              <dl className="flex" style={{ marginBottom: 0 }}>
                <dt>
                  <InfoCircleOutlined />
                </dt>
                <dd style={{ marginLeft: 8, marginBottom: 0 }}>
                  {intl.formatMessage(
                    {
                      id: 'models.form.backendVersions.tips'
                    },
                    {
                      link: (
                        <a onClick={() => navigate('/resources/backends')}>
                          {intl.formatMessage({ id: 'backends.title' })}
                        </a>
                      )
                    }
                  )}
                </dd>
              </dl>
            }
          >
            {(backendVersions.builtIn.length > 0 ||
              backendVersions.custom.length > 0) && (
              <Select.Option
                key="auto"
                value={null}
                title={intl.formatMessage({ id: 'common.options.auto' })}
                label={intl.formatMessage({
                  id: 'common.options.auto'
                })}
              >
                {intl.formatMessage({ id: 'common.options.auto' })}
              </Select.Option>
            )}
            {renderVersionOptions(
              backendVersions.builtIn,
              intl.formatMessage({ id: 'backend.builtin' })
            )}
            {renderVersionOptions(
              backendVersions.custom,
              intl.formatMessage({ id: 'models.form.backend.custom' })
            )}
            {renderDeprecatedVersionOptions(backendVersions.deprecated)}
          </SealSelect>
        </Form.Item>
      )}
    </>
  );
};

export default BackendFields;
