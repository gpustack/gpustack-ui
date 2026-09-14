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
import { Button, Form, Select } from 'antd';
import { createStyles } from 'antd-style';
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
// backend stays vLLM/SGLang, while the image determines its runtime features.
const imageOverrideBackends = [
  backendOptionsMap.vllm,
  backendOptionsMap.SGLang
];

const useStyles = createStyles(({ css }) => ({
  customImageEntry: css`
    width: 100%;
    height: auto;
    margin: -4px -8px 0;
    padding: 5px 8px;
    border-radius: var(--ant-border-radius-sm);
    color: var(--ant-color-primary);
    justify-content: flex-start;
    &:hover {
      background-color: var(--ant-color-fill-tertiary);
    }
  `,
  footerDivider: css`
    margin: 8px -12px;
    border-top: 1px solid var(--ant-color-split);
  `
}));

interface BackendFieldsProps {
  /**
   * Renders the same fields at a nested Form path (e.g. `['roles', 0]`) so a
   * role tab can override the model-level engine. Absent means the
   * model-level path, byte-for-byte what it was.
   */
  namePrefix?: (string | number)[];
}

const BackendFields: React.FC<BackendFieldsProps> = ({ namePrefix }) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { styles } = useStyles();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const {
    action,
    initialValues,
    onValuesChange,
    backendOptions,
    flatBackendOptions,
    onBackendChange,
    imageModePicked,
    setImageModePicked
  } = useFormContext();
  // Every Form path below goes through this, so the whole section can move
  // under a role without any field knowing about roles.
  const path = (...field: (string | number)[]) =>
    namePrefix ? [...namePrefix, ...field] : field;
  const backend = Form.useWatch(path('backend'), form);
  const backendVersion = Form.useWatch(path('backend_version'), form);
  const imageName = Form.useWatch(path('image_name'), form);
  const [showDeprecated, setShowDeprecated] = React.useState<boolean>(false);
  const [versionOpen, setVersionOpen] = React.useState<boolean>(false);
  const imageEntryRef = React.useRef<HTMLButtonElement>(null);
  const { openTips, diffEnvs, handleCloseTips, handleCompareEnvs } =
    useCompareEnvs();

  // `getFieldsValue()` (no arguments) is the whole store either way, so the
  // compatibility consumer still receives a model-level shape. The
  // changed-values argument is dropped under a prefix: nothing downstream
  // parses a role path, and a role-shaped key would read as an unknown
  // model-level field.
  const notifyValuesChange = (changedValues: Record<string, any>) => {
    onValuesChange?.(namePrefix ? {} : changedValues, form.getFieldsValue());
  };

  const supportsImageOverride = imageOverrideBackends.includes(backend);
  // Picking the dropdown entry has to hold the mode while the field is still
  // empty; past that the value itself implies it, which is how a catalog spec
  // or an edited deployment opens straight into the image.
  const isImageMode =
    supportsImageOverride &&
    !backendVersion &&
    (imageModePicked || !!imageName);

  // The select is only hidden from here on and still submits its value, so a
  // version picked before this has to be cleared.
  const handleUseCustomImage = () => {
    form.setFieldValue(path('backend_version'), null);
    setImageModePicked(true);
    setVersionOpen(false);
  };

  const handleVersionKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === 'Tab' &&
      !e.shiftKey &&
      versionOpen &&
      supportsImageOverride
    ) {
      e.preventDefault();
      imageEntryRef.current?.focus();
    }
  };

  const handleBackendVersionOnChange = (value: any, option: any) => {
    setImageModePicked(false);
    if (Object.keys(option.data?.env || {}).length > 0) {
      form.setFieldValue(path('env'), { ...(option?.data?.env || {}) });
    }

    notifyValuesChange({});
  };

  const handleBackToVersion = (e: React.MouseEvent) => {
    // The label wrapper focuses its control on click.
    e.stopPropagation();
    setImageModePicked(false);
    form.setFieldValue(path('image_name'), null);
    form.setFieldValue(path('run_command'), null);
    notifyValuesChange({});
  };

  // Emptying the field must not fold the form back to the version select: the
  // link beside the label is the only way out of the image.
  const handleImageNameOnChange = () => {
    setImageModePicked(true);
  };

  // The runner catalog image applies again once the field is cleared, and with
  // it the architecture checks that a pinned image skips, so either direction
  // is worth re-evaluating.
  const handleImageNameOnBlur = () => {
    notifyValuesChange({});
  };

  const handleRunCommandOnBlur = () => {
    notifyValuesChange({});
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
    setImageModePicked(false);
    form.setFieldValue(path('backend'), value);
    form.setFieldValue(path('env'), {
      ...(option.default_env || {})
    });
    if (namePrefix) {
      // The context handler writes MODEL-level fields (backend_version,
      // backend_parameters, the KV-cache and speculative blocks,
      // gpu_selector); running it from a role tab would overwrite the model
      // with one role's choice. Do the role-scoped half of the same work here
      // instead: drop the version so it is re-picked for the new engine, and
      // seed the engine's default parameters. Both belong to override groups
      // that may still be inheriting — harmless, because a group left on
      // "same as model" submits null whatever the field holds.
      form.setFieldValue(path('backend_version'), null);
      form.setFieldValue(
        path('backend_parameters'),
        option.default_backend_param || []
      );
      notifyValuesChange({});
      return;
    }
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
    form.setFieldValue(path('env'), { ...envs });
    notifyValuesChange({});
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
        name={path('backend')}
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
            name={path('image_name')}
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
                <Button
                  type="link"
                  className="m-l-8 font-size-12"
                  style={{ padding: 0, height: 'auto' }}
                  onClick={handleBackToVersion}
                >
                  {intl.formatMessage({
                    id: 'models.form.customImage.backToVersion'
                  })}
                </Button>
              }
              description={intl.formatMessage(
                { id: 'models.form.customImage.tips' },
                { backend }
              )}
            ></CInput.Input>
          </Form.Item>
          <Form.Item<FormData> name={path('run_command')} hidden={!isImageMode}>
            <SealTextArea
              allowClear
              scaleSize={false}
              alwaysFocus={true}
              autoSize={{ minRows: 2, maxRows: 5 }}
              onBlur={handleRunCommandOnBlur}
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
                    backend === backendOptionsMap.SGLang
                      ? '--model-path {{model_path}}'
                      : '{{model_path}}'
                }
              )}
            ></SealTextArea>
          </Form.Item>
        </>
      )}
      {backendOptionsMap.custom !== backend && (
        <Form.Item
          name={path('backend_version')}
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
            onKeyDown={handleVersionKeyDown}
            onChange={handleBackendVersionOnChange}
            label={intl.formatMessage({ id: 'models.form.backendVersion' })}
            // The footer sits outside the scrolling option list, so the entry
            // stays reachable however many versions a backend carries.
            footer={
              <>
                {supportsImageOverride && (
                  <>
                    <Button
                      ref={imageEntryRef}
                      type="text"
                      icon={<ProfileOutlined />}
                      className={styles.customImageEntry}
                      // Keep the click from blurring the select before it lands.
                      onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                      onClick={handleUseCustomImage}
                    >
                      {intl.formatMessage({
                        id: 'models.form.customImage.entry'
                      })}
                    </Button>
                    <div className={styles.footerDivider} />
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
