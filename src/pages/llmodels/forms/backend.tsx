import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useMemo } from 'react';
import { backendTipsList } from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';

const BackendFields: React.FC = () => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const { onValuesChange, backendOptions, onBackendChange } = useFormContext();
  const backend = Form.useWatch('backend', form);

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

  const backendVersions = useMemo(() => {
    if (!backend || backend === backendOptionsMap.custom) {
      return [];
    }

    // find the backend item from backendOptions
    const backendItem = backendOptions.find((item) => item.value === backend);

    const versions = backendItem?.versions || [];

    // if it's a custom backend,
    if (backendItem && !backendItem.isBuiltIn) {
      return versions;
    }

    // check the value if endts with '-custom', if true, remove the suffix  add to  "Cutom" group, if not , add to "Built-in" group
    const builtInVersions = versions.filter(
      (item) => !item.value?.endsWith('-custom')
    );
    const customVersions = versions.filter((item) =>
      item.value?.endsWith('-custom')
    );

    const options = [];

    if (builtInVersions.length > 0) {
      options.push({
        label: intl.formatMessage({ id: 'backend.builtin' }),
        options: builtInVersions
      });
    }

    if (customVersions.length > 0) {
      options.push({
        label: intl.formatMessage({ id: 'models.form.backend.custom' }),
        options: customVersions
      });
    }

    return options;
  }, [backend, backendOptions, intl]);

  const optionRender = (option: any) => {
    return option.data.title;
  };

  const versionOptionRender = (option: any) => {
    const { data } = option;
    return data.is_deprecated ? (
      <span>
        {data.title}
        <span className="text-tertiary m-l-4">[Deprecated]</span>
      </span>
    ) : (
      <span>{data.title}</span>
    );
  };

  const labelRender = (option: any) => {
    return option.title;
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
            options={backendVersions}
            optionRender={versionOptionRender}
            labelRender={labelRender}
            placeholder={intl.formatMessage({
              id: 'models.form.backendVersion.holder'
            })}
            onChange={handleBackendVersionOnChange}
            label={intl.formatMessage({ id: 'models.form.backendVersion' })}
          ></SealSelect>
        </Form.Item>
      )}
    </>
  );
};

export default BackendFields;
