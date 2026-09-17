import { localize } from '@/utils/localize';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons';
import {
  CheckboxField,
  Input as CInput,
  CollapseContainer,
  InputNumber,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Form, FormInstance } from 'antd';
import React, { useMemo, useState } from 'react';
import {
  CacheProviderL2Backend,
  CacheProviderL2Field,
  L2StorageConfig
} from '../config/types';
import { EntryTitle, GroupTips, GroupTitle, OptionWithIcon } from './styled';
import { humanizeFieldName } from './utils';

// the switch position a backend starts on, and the one the cache server
// runs with while an entry leaves the state unset (saved by the API, or
// before the backend declared the switch)
const l2ConfigDefault = (spec?: CacheProviderL2Backend) =>
  spec?.adapter_flag_default !== false;

const renderL2FieldControl = (field: CacheProviderL2Field, label: string) => {
  // the backend's own description covers its field set; a field
  // carrying one explains the knob its label cannot
  const description = localize(field.description);
  switch (field.type) {
    case 'number':
      return (
        <InputNumber
          required={field.required}
          label={label}
          description={description}
        />
      );
    case 'boolean':
      return <CheckboxField label={label} description={description} />;
    case 'password':
      return (
        <CInput.Password
          required={field.required}
          label={label}
          description={description}
        />
      );
    default:
      return (
        <CInput.Input
          required={field.required}
          label={label}
          description={description}
        />
      );
  }
};

// The cascade of L2 stores the service spills to, in read priority.
// Entries are provider-specific, so the caller remounts this on a
// provider switch and the open-panel state starts over with them.
const L2Storages: React.FC<{
  form: FormInstance;
  l2Backends: Record<string, CacheProviderL2Backend>;
}> = ({ form, l2Backends }) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const [collapseKeys, setCollapseKeys] = useState<Set<number>>(new Set());
  const l2Storages: L2StorageConfig[] | undefined = Form.useWatch(
    ['config', 'l2_storages'],
    form
  );

  const renderBackendOption = (option: any) => (
    <OptionWithIcon
      icon={option.data?.icon}
      fallbackGlyph="icon-hard-disk"
      label={option.label}
    />
  );

  // labelRender mirrors optionRender so the closed select shows the
  // same icon as the dropdown entries
  const renderBackendLabel = (data: any) => (
    <OptionWithIcon
      icon={l2Backends[data.value]?.icon}
      fallbackGlyph="icon-hard-disk"
      label={data.label}
    />
  );

  const backendOptions = useMemo(() => {
    return Object.entries(l2Backends).map(([key, backend]) => ({
      label: localize(backend.display_name) || key,
      value: key,
      icon: backend.icon
    }));
  }, [l2Backends]);

  // a backend's declared starting state: its field defaults, plus the
  // initial position of the switch when configuring it is optional
  const seedEntry = (backend: string) => {
    const spec = l2Backends[backend];
    const params: Record<string, any> = {};
    spec?.fields?.forEach((field) => {
      if (field.default !== undefined) {
        params[field.name] = field.default;
      }
    });
    return {
      params,
      adapter_flag_enabled: spec?.adapter_flag_optional
        ? l2ConfigDefault(spec)
        : undefined
    };
  };

  const handleAdd = async () => {
    try {
      await form.validateFields([['config', 'l2_storages']], {
        recursive: true
      });
      const list = form.getFieldValue(['config', 'l2_storages']) || [];
      // The new entry opens on the provider's first declared backend,
      // seeded as a manual pick would be: the declaration's order is its
      // recommendation, and an empty Type asks a question whose answer
      // is almost always the first one.
      const [firstBackend] = Object.keys(l2Backends);
      const entry = firstBackend
        ? { backend: firstBackend, ...seedEntry(firstBackend) }
        : { backend: undefined, params: {} };
      form.setFieldValue(['config', 'l2_storages'], [...list, entry]);
      setTimeout(() => {
        setCollapseKeys(new Set([list.length]));
      }, 100);
    } catch (error: any) {
      const errorIndex = error?.errorFields?.[0]?.name?.[2];
      if (typeof errorIndex === 'number') {
        setCollapseKeys(new Set([errorIndex]));
      }
    }
  };

  // adjacent moves are index swaps; keep the open panel attached
  // to the entry it was opened for
  const handleMove = (
    move: (from: number, to: number) => void,
    from: number,
    to: number
  ) => {
    move(from, to);
    setCollapseKeys((prev) => {
      const next = new Set<number>();
      prev.forEach((key) => {
        next.add(key === from ? to : key === to ? from : key);
      });
      return next;
    });
  };

  const handleRemove = (remove: (index: number) => void, index: number) => {
    remove(index);
    setCollapseKeys((prev) => {
      const next = new Set<number>();
      prev.forEach((key) => {
        if (key < index) {
          next.add(key);
        } else if (key > index) {
          next.add(key - 1);
        }
      });
      return next;
    });
  };

  const handleBackendChange = (index: number, value: string) => {
    // params and the switch are backend-specific; reseed this entry from
    // the newly selected backend's declared defaults
    const { params, adapter_flag_enabled } = seedEntry(value);
    form.setFieldValue(['config', 'l2_storages', index, 'params'], params);
    form.setFieldValue(
      ['config', 'l2_storages', index, 'adapter_flag_enabled'],
      adapter_flag_enabled
    );
  };

  if (!backendOptions.length) {
    return null;
  }

  return (
    <>
      <GroupTitle>
        <span className="flex-center gap-8">
          <span>{intl.formatMessage({ id: 'kvCache.form.l2Backend' })}</span>
          <Button type="link" onClick={handleAdd}>
            <PlusOutlined />
            {intl.formatMessage({ id: 'kvCache.form.l2Backend.add' })}
          </Button>
        </span>
      </GroupTitle>
      <GroupTips>
        {intl.formatMessage({ id: 'kvCache.form.l2Backend.tips' })}
      </GroupTips>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '16px'
        }}
      >
        <Form.List name={['config', 'l2_storages']}>
          {(fields, { remove, move }) =>
            fields.map(({ key, name }) => {
              const entryBackendName = l2Storages?.[name]?.backend;
              const entryBackend = entryBackendName
                ? l2Backends[entryBackendName]
                : undefined;
              return (
                <div
                  key={key}
                  style={{
                    border: '1px solid var(--ant-color-split)',
                    borderRadius: 'var(--ant-border-radius-lg)'
                  }}
                >
                  <CollapseContainer
                    collapsible={true}
                    showExpandIcon={true}
                    open={collapseKeys.has(name)}
                    onToggle={(open: boolean) =>
                      setCollapseKeys(open ? new Set([name]) : new Set())
                    }
                    styles={{
                      body: collapseKeys.has(name)
                        ? { paddingBlock: '16px 0', paddingInline: 16 }
                        : {},
                      content: { paddingTop: 0 },
                      header: {
                        backgroundColor: 'unset'
                      }
                    }}
                    title={
                      <EntryTitle>
                        <span>
                          {localize(entryBackend?.display_name) ||
                            entryBackendName ||
                            intl.formatMessage({
                              id: 'kvCache.form.l2Backend.backend'
                            })}
                        </span>
                      </EntryTitle>
                    }
                    right={
                      <span
                        className="flex-center gap-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Cascade order is read priority; the
                            controls only appear once there is an
                            order to change. */}
                        {fields.length > 1 && (
                          <>
                            <Button
                              size="small"
                              shape="circle"
                              disabled={name === 0}
                              onClick={() => handleMove(move, name, name - 1)}
                            >
                              <ArrowUpOutlined />
                            </Button>
                            <Button
                              size="small"
                              shape="circle"
                              disabled={name === fields.length - 1}
                              onClick={() => handleMove(move, name, name + 1)}
                            >
                              <ArrowDownOutlined />
                            </Button>
                          </>
                        )}
                        <Button
                          size="small"
                          shape="circle"
                          onClick={() => handleRemove(remove, name)}
                        >
                          <MinusOutlined />
                        </Button>
                      </span>
                    }
                  >
                    <Form.Item
                      name={[name, 'backend']}
                      rules={[
                        {
                          required: true,
                          message: getRuleMessage(
                            'select',
                            'kvCache.form.l2Backend.type'
                          )
                        }
                      ]}
                    >
                      <SealSelect
                        required
                        options={backendOptions}
                        optionRender={renderBackendOption}
                        labelRender={renderBackendLabel}
                        onChange={(value: string) =>
                          handleBackendChange(name, value)
                        }
                        label={intl.formatMessage({
                          id: 'kvCache.form.l2Backend.type'
                        })}
                        description={localize(entryBackend?.description)}
                      />
                    </Form.Item>
                    {entryBackend?.adapter_flag_optional && (
                      <Form.Item
                        // remount per backend: the switch belongs
                        // to the backend that declared it
                        key={`${entryBackendName}-adapter-flag`}
                        name={[name, 'adapter_flag_enabled']}
                        valuePropName="checked"
                        getValueProps={(value) => ({
                          checked: value ?? l2ConfigDefault(entryBackend)
                        })}
                      >
                        <CheckboxField
                          label={
                            localize(entryBackend.adapter_flag_label) ||
                            intl.formatMessage({
                              id: 'kvCache.form.l2Backend.customOptions'
                            })
                          }
                        />
                      </Form.Item>
                    )}
                    {/* the backend carries a working configuration
                        of its own while the switch is off, and the
                        fields have nothing to apply to */}
                    {(!entryBackend?.adapter_flag_optional ||
                      (l2Storages?.[name]?.adapter_flag_enabled ??
                        l2ConfigDefault(entryBackend))) &&
                      entryBackend?.fields?.map((field) => {
                        const label =
                          localize(field.label) ||
                          humanizeFieldName(field.name);
                        const isBoolean = field.type === 'boolean';
                        return (
                          <Form.Item
                            // remount per backend so same-named params never leak across backends
                            key={`${entryBackendName}-${field.name}`}
                            name={[name, 'params', field.name]}
                            valuePropName={isBoolean ? 'checked' : 'value'}
                            rules={
                              field.required && !isBoolean
                                ? [
                                    {
                                      required: true,
                                      message: getRuleMessage(
                                        'input',
                                        label,
                                        false
                                      )
                                    }
                                  ]
                                : []
                            }
                          >
                            {renderL2FieldControl(field, label)}
                          </Form.Item>
                        );
                      })}
                  </CollapseContainer>
                </div>
              );
            })
          }
        </Form.List>
      </div>
    </>
  );
};

export default L2Storages;
