import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import useAppUtils from '@/hooks/use-app-utils';
import { CaretDownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useIntl, useNavigate } from '@umijs/max';
import { Form, Select } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { backendTipsList } from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';

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
  const { onValuesChange, backendOptions, onBackendChange } = useFormContext();
  const backend = Form.useWatch('backend', form);
  const [showDeprecated, setShowDeprecated] = React.useState<boolean>(false);

  const handleBackendVersionOnChange = (value: any) => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  const backendGroupedOptions = useMemo(() => {
    const builtInBackends = backendOptions?.filter(
      (item) => item.isBuiltIn || item.value === backendOptionsMap.custom
    );
    const customBackends = backendOptions?.filter(
      (item) => !item.isBuiltIn && item.value !== backendOptionsMap.custom
    );

    const options = [];

    if (builtInBackends && builtInBackends.length > 0) {
      options.push({
        label: intl.formatMessage({ id: 'backend.builtin' }),
        options: builtInBackends
      });
    }

    if (customBackends && customBackends.length > 0) {
      options.push({
        label: intl.formatMessage({ id: 'models.form.backend.custom' }),
        options: customBackends
      });
    }
    return options;
  }, [backendOptions, intl]);

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

    // find the backend item from backendOptions
    const backendItem = backendOptions.find((item) => item.value === backend);

    const versions = backendItem?.versions || [];

    // if it's a custom backend,
    if (backendItem && !backendItem.isBuiltIn) {
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
  }, [backend, backendOptions, intl]);

  const optionRender = (option: any) => {
    return option.data.title;
  };

  const labelRender = (option: any) => {
    return option.title;
  };

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

  return (
    <>
      <Form.Item
        name="backend"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'models.form.backend')
          }
        ]}
      >
        <SealSelect
          required
          onChange={onBackendChange}
          label={intl.formatMessage({ id: 'models.form.backend' })}
          description={<TooltipList list={backendTipsList}></TooltipList>}
          options={backendGroupedOptions}
          optionRender={optionRender}
          labelRender={labelRender}
        ></SealSelect>
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
