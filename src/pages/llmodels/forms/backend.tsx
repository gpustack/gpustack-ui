import IconFont from '@/components/icon-font';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form, Typography } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import {
  backendLabelMap,
  backendTipsList,
  getBackendParamsTips
} from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';

const Box = styled.div`
  &.default-backend {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
`;

const BackendFields: React.FC = () => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const { onValuesChange, backendOptions, onBackendChange } = useFormContext();
  const backend = Form.useWatch('backend', form);

  const handleBackendVersionOnBlur = () => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  const backendParamsTips = useMemo(() => {
    return getBackendParamsTips(backend);
  }, [backend]);

  const backendVersions = useMemo(() => {
    if (!backend || backend === backendOptionsMap.custom) {
      return [];
    }

    // find the backend item from backendOptions
    const backendItem = backendOptions
      .flatMap((group) => group.options)
      .find((item) => item.value === backend);

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
        label: intl.formatMessage({ id: 'backend.custom' }),
        options: customVersions
      });
    }

    return options;
  }, [backend, backendOptions, intl]);

  const optionRender = (option: any) => {
    return option.data.title;
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
          options={backendOptions}
          optionRender={optionRender}
          labelRender={labelRender}
        ></SealSelect>
      </Form.Item>
      {backendOptionsMap.custom !== backend && (
        <Form.Item name="backend_version">
          <SealSelect
            options={backendVersions}
            optionRender={optionRender}
            labelRender={labelRender}
            placeholder={intl.formatMessage({
              id: 'models.form.backendVersion.holder'
            })}
            onBlur={handleBackendVersionOnBlur}
            label={intl.formatMessage({ id: 'models.form.backendVersion' })}
            description={intl.formatMessage(
              {
                id: 'models.form.backendVersion.tips'
              },
              {
                backend: backendLabelMap[backend],
                version: backendParamsTips?.version
                  ? `(${intl.formatMessage({ id: 'common.help.eg' }, { content: '' })} ${backendParamsTips?.version})`
                  : '',
                link: backendParamsTips?.releases && (
                  <span
                    style={{
                      marginLeft: 5
                    }}
                  >
                    <Typography.Link
                      className="flex-center"
                      style={{ display: 'inline' }}
                      href={backendParamsTips?.releases}
                      target="_blank"
                    >
                      <span>
                        {intl.formatMessage({ id: 'models.form.releases' })}
                      </span>
                      <IconFont
                        type="icon-external-link"
                        className="font-size-14 m-l-4"
                      ></IconFont>
                    </Typography.Link>
                  </span>
                )
              }
            )}
          ></SealSelect>
        </Form.Item>
      )}
    </>
  );
};

export default BackendFields;
