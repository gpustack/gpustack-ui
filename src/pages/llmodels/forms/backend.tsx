import { isCustomSourceType } from '@/pages/_components/source-config/config';
import {
  CaretDownOutlined,
  InfoCircleOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import {
  Input as CInput,
  Select as SealSelect,
  Textarea as SealTextArea,
  TextAttribute,
  ThemeTag,
  TooltipList,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl, useNavigate } from '@umijs/max';
import { Form, Select } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { backendTipsList } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import { backendOptionsMap } from '../constants/backend-parameters';
import useCompareEnvs from '../hooks/use-compare-envs';
import EnvsOverridePopover from './envs-override-popover';

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

// A built-in backend can pin a container image instead of a version from the
// runner catalog, for a runtime the version list does not carry yet. The
// backend stays vLLM/SGLang, so scheduling and distributed inference are
// unaffected — unlike the Custom backend, which cannot be scheduled across
// workers.
const imageOverrideBackends = [
  backendOptionsMap.vllm,
  backendOptionsMap.SGLang
];

const CustomImageEntry = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: -4px -8px 0;
  padding: 5px 8px;
  border-radius: var(--ant-border-radius-sm);
  color: var(--ant-color-primary);
  cursor: pointer;
  &:hover {
    background-color: var(--ant-color-fill-tertiary);
  }
`;

// Full-bleed against the footer's own horizontal padding.
const FooterDivider = styled.div`
  margin: 8px -12px;
  border-top: 1px solid var(--ant-color-split);
`;

const BackendFields: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const {
    action,
    initialValues,
    onValuesChange,
    backendOptions,
    flatBackendOptions,
    onBackendChange
  } = useFormContext();
  const backend = Form.useWatch('backend', form);
  const imageName = Form.useWatch('image_name', form);
  const [showDeprecated, setShowDeprecated] = React.useState<boolean>(false);
  const [imageModePicked, setImageModePicked] = React.useState<boolean>(false);
  const [versionOpen, setVersionOpen] = React.useState<boolean>(false);
  const { openTips, diffEnvs, handleCloseTips, handleCompareEnvs } =
    useCompareEnvs();

  const supportsImageOverride = imageOverrideBackends.includes(backend);
  // Picking the dropdown entry has to hold the mode while the field is still
  // empty; past that the value itself implies it, which is how a catalog spec
  // or an edited deployment opens straight into the image.
  const isImageMode = supportsImageOverride && (imageModePicked || !!imageName);

  // Switching the backend drops the image along with the other backend-scoped
  // fields, so the way this deployment pins its runtime resets with them. The
  // deploy modal also sets the backend without going through the field's own
  // handler, which is why this watches the value rather than the event.
  React.useEffect(() => {
    setImageModePicked(false);
  }, [backend]);

  // The select is only hidden from here on and still submits its value, so a
  // version picked before this has to be cleared.
  const handleUseCustomImage = () => {
    form.setFieldValue('backend_version', null);
    setImageModePicked(true);
    setVersionOpen(false);
  };

  const handleBackendVersionOnChange = (value: any, option: any) => {
    if (Object.keys(option.data?.env || {}).length > 0) {
      form.setFieldValue('env', { ...(option?.data?.env || {}) });
    }

    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleBackToVersion = (e: React.MouseEvent) => {
    // The label wrapper focuses its control on click.
    e.stopPropagation();
    setImageModePicked(false);
    form.setFieldsValue({ image_name: null, run_command: null });
    onValuesChange?.({}, form.getFieldsValue());
  };

  // Emptying the field must not fold the form back to the version select: the
  // link beside the label is the only way out of the image.
  const handleImageNameOnChange = () => {
    setImageModePicked(true);
  };

  // The runner catalog image applies again once the field is cleared, and with
  // it the architecture checks that a pinned image skips, so either direction
  // is worth re-evaluating.
  const handleImageNameOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onValuesChange?.({ image_name: e.target.value }, form.getFieldsValue());
  };

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

    const selectedBackend = flatBackendOptions.find(
      (item) => item.value === backend
    );

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
  }, [backend, flatBackendOptions, intl]);

  const backendVersionLabelRender = (option: any) => {
    return option.title;
  };

  const renderVersionOptions = (values: any[], label: string) => {
    if (!values || values.length === 0) {
      return null;
    }

    return (
      <Select.OptGroup label={label}>
        {values.map((item) => (
          <Select.Option
            data={item}
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

  const handleOnBackendChange = (value: any, option: any) => {
    form.setFieldsValue({
      backend: value
    });
    form.setFieldValue('env', {
      ...(option.default_env || {})
    });
    onBackendChange?.(value, option);
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

  const handleOnSaveEnvsOverride = (envs: Record<string, any>) => {
    form.setFieldsValue({
      env: { ...envs }
    });
    onValuesChange?.({}, form.getFieldsValue());
    handleCloseTips();
  };

  // A backend is imported as a whole, so the source stamp is only meaningful
  // here: a custom (file / url) source produced it, rather than the packaged
  // content or a hand-added backend.
  const optionRender = (option: any) => {
    return (
      // ThemeTag is display:flex, so it needs a flex row to sit beside the name
      // instead of breaking onto a line of its own inside the option content.
      <span className="flex-center gap-8">
        {option.data.title}
        {isCustomSourceType(option.data?.source_type) && (
          <ThemeTag color="purple" opacity={0.7} style={{ flex: 'none' }}>
            {intl.formatMessage({ id: 'common.source.tag.custom' })}
          </ThemeTag>
        )}
      </span>
    );
  };

  const labelRender = (option: any) => {
    return option.title;
  };

  const backendGroupList = useMemo(() => {
    if (backendOptions.length === 1) {
      return [...backendOptions[0].options];
    }
    return backendOptions;
  }, [backendOptions]);

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
          showSearch
          // Without this the search filters on `value` (the backend name),
          // which is not what the option shows for the built-in "custom"
          // backend: its label is the translated "Custom", so typing that
          // matched nothing in any locale but English.
          optionFilterProp="label"
          onChange={handleOnBackendChange}
          label={intl.formatMessage({ id: 'models.form.backend' })}
          description={<TooltipList list={backendTipsList}></TooltipList>}
          options={backendGroupList}
          optionRender={optionRender}
          labelRender={labelRender}
        ></SealSelect>
      </Form.Item>
      {backendOptionsMap.custom !== backend && supportsImageOverride && (
        <>
          <Form.Item<FormData>
            name="image_name"
            // Hidden rather than unmounted: an unregistered field is left out of
            // the submitted values, and unmounting one under `preserve={false}`
            // restores the value the form was opened with — so clearing the
            // image while editing would never reach the server.
            hidden={!isImageMode}
            rules={
              isImageMode
                ? [
                    {
                      required: true,
                      message: getRuleMessage(
                        'input',
                        'models.form.customImage'
                      )
                    }
                  ]
                : undefined
            }
          >
            <CInput.Input
              required
              allowClear
              onChange={handleImageNameOnChange}
              onBlur={handleImageNameOnBlur}
              label={intl.formatMessage({ id: 'models.form.customImage' })}
              labelExtra={
                <a className="m-l-8 font-size-12" onClick={handleBackToVersion}>
                  {intl.formatMessage({
                    id: 'models.form.customImage.backToVersion'
                  })}
                </a>
              }
              description={intl.formatMessage(
                { id: 'models.form.customImage.tips' },
                { backend }
              )}
            ></CInput.Input>
          </Form.Item>
          <Form.Item<FormData> name="run_command" hidden={!isImageMode}>
            <SealTextArea
              allowClear
              scaleSize={false}
              alwaysFocus={true}
              autoSize={{ minRows: 2, maxRows: 5 }}
              label={intl.formatMessage({ id: 'backend.runCommand' })}
              labelExtra={
                <TextAttribute className="m-l-4">
                  {intl.formatMessage({ id: 'common.form.field.optional' })}
                </TextAttribute>
              }
              description={intl.formatMessage({
                id: 'models.form.customRunCommand.tips'
              })}
              placeholder={intl.formatMessage(
                { id: 'common.help.eg' },
                {
                  content:
                    '{{model_path}} --port {{port}} --host {{worker_ip}} --served-model-name {{model_name}}'
                }
              )}
            ></SealTextArea>
          </Form.Item>
        </>
      )}
      {backendOptionsMap.custom !== backend && (
        <Form.Item
          name="backend_version"
          hidden={isImageMode}
          help={
            openTips && (
              <EnvsOverridePopover
                onSave={handleOnSaveEnvsOverride}
                diffEnvs={diffEnvs}
              ></EnvsOverridePopover>
            )
          }
        >
          <SealSelect
            allowClear
            showSearch
            allowNull
            // The version options label themselves with their own value, but
            // the leading "Auto" entry carries a null value, so the default
            // filter (on `value`) can never match the word the option shows.
            optionFilterProp="label"
            labelRender={backendVersionLabelRender}
            placeholder={intl.formatMessage({
              id: 'models.form.backendVersion.holder'
            })}
            description={<TooltipList list={backendTipsList}></TooltipList>}
            open={versionOpen}
            onOpenChange={setVersionOpen}
            onChange={handleBackendVersionOnChange}
            label={intl.formatMessage({ id: 'models.form.backendVersion' })}
            // The footer sits outside the scrolling option list, so the entry
            // stays reachable however many versions a backend carries.
            footer={
              <>
                {supportsImageOverride && (
                  <>
                    <CustomImageEntry
                      // Keep the click from blurring the select before it lands.
                      onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                      onClick={handleUseCustomImage}
                    >
                      <ProfileOutlined />
                      {intl.formatMessage({
                        id: 'models.form.customImage.entry'
                      })}
                    </CustomImageEntry>
                    <FooterDivider />
                  </>
                )}
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
                          <a onClick={() => navigate('/models/backends')}>
                            {intl.formatMessage({ id: 'backends.title' })}
                          </a>
                        )
                      }
                    )}
                  </dd>
                </dl>
              </>
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
