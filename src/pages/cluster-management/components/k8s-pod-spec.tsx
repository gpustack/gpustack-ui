import {
  MinusOutlined,
  PlusOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import {
  Input as CInput,
  CollapseContainer,
  LabelSelector,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Form, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { GPUsConfigs } from '../../resources/config/gpu-driver';

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: transparent;
  font-weight: 500;
  font-size: 14px;
  padding-top: 0px;
  padding-bottom: 8px;
`;

const Label = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ant-color-text-secondary);
`;

const SectionWrap = styled.div`
  margin-bottom: 16px;
`;

const ImageCredentialsForm: React.FC = () => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();

  return (
    <SectionWrap>
      <Form.List name={['k8s_options', 'imageCredentials']}>
        {(fields, { add, remove }) => (
          <>
            <Title>
              <div className="flex-center gap-8">
                <span>
                  {intl.formatMessage({
                    id: 'clusters.imageCredentials.title'
                  })}
                </span>
                <Button
                  type="link"
                  onClick={() =>
                    add({ registry: '', username: '', password: '' })
                  }
                >
                  <PlusOutlined />{' '}
                  {intl.formatMessage({
                    id: 'clusters.imageCredentials.add'
                  })}
                </Button>
              </div>
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fields.map(({ key, name }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: 12,
                    border: '1px solid var(--ant-color-split)',
                    borderRadius: 'var(--ant-border-radius-lg)'
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}
                  >
                    <Form.Item
                      name={[name, 'registry']}
                      rules={[
                        {
                          required: true,
                          message: getRuleMessage(
                            'input',
                            'clusters.imageCredentials.registry'
                          )
                        }
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <CInput.Input
                        required
                        label={intl.formatMessage({
                          id: 'clusters.imageCredentials.registry'
                        })}
                      ></CInput.Input>
                    </Form.Item>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Form.Item
                          name={[name, 'username']}
                          style={{ marginBottom: 0 }}
                        >
                          <CInput.Input
                            label={intl.formatMessage({
                              id: 'clusters.imageCredentials.username'
                            })}
                          ></CInput.Input>
                        </Form.Item>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Form.Item
                          name={[name, 'password']}
                          style={{ marginBottom: 0 }}
                        >
                          <CInput.Password
                            label={intl.formatMessage({
                              id: 'clusters.imageCredentials.password'
                            })}
                          ></CInput.Password>
                        </Form.Item>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="small"
                    shape="circle"
                    style={{ marginTop: 8 }}
                    onClick={() => remove(name)}
                  >
                    <MinusOutlined />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </Form.List>
    </SectionWrap>
  );
};

const NodeSelectorForm: React.FC = () => {
  const intl = useIntl();

  return (
    <SectionWrap>
      <Title>
        <span className="flex-center gap-4">
          <span>
            {intl.formatMessage({ id: 'clusters.nodeSelector.title' })}
          </span>
          <Tooltip
            title={intl.formatMessage({ id: 'clusters.nodeSelector.tip' })}
          >
            <QuestionCircleOutlined
              style={{ color: 'var(--ant-color-text-secondary)' }}
            />
          </Tooltip>
        </span>
      </Title>
      <Form.Item name={['k8s_options', 'nodeSelector']}>
        <LabelSelector
          label={intl.formatMessage({ id: 'clusters.nodeSelector.title' })}
        ></LabelSelector>
      </Form.Item>
    </SectionWrap>
  );
};

const vendorOptions = Object.values(GPUsConfigs)
  .filter((c) => !!c.gpuVendor)
  .map((c) => ({ label: c.label, value: c.gpuVendor as string }));

const GpuVendorOverridesForm: React.FC<{
  initialValue?: Record<string, { nodeSelector?: Record<string, string> }>;
}> = ({ initialValue }) => {
  const intl = useIntl();
  const form = Form.useFormInstance();

  // Single source of truth for the cards while the user is editing.
  // We mirror it into the form via setFieldValue so submit picks it up.
  // Seed local state directly from the parent's currentData — Form.useWatch
  // on a non-registered nested path proved unreliable for picking up
  // initialValues, so we cut out that indirection.
  const [overrides, setOverrides] = useState<
    Record<string, { nodeSelector?: Record<string, string> }>
  >(() => initialValue || {});
  const [collapseKey, setCollapseKey] = useState<Set<string>>(new Set());
  const initializedRef = useRef(!!initialValue);

  // On mount: if we seeded with an initialValue, mirror it into the form so
  // submit collects it. (When seeded, initializedRef is already true.)
  useEffect(() => {
    if (initialValue && Object.keys(initialValue).length > 0) {
      form.setFieldValue(['k8s_options', 'gpuVendorOverrides'], initialValue);
    }
  }, []);

  // If the parent currentData arrives after mount (e.g. async fetch), adopt
  // it once. After the user has interacted (`initializedRef`), local state
  // owns the visible list.
  useEffect(() => {
    if (initializedRef.current) return;
    if (initialValue && Object.keys(initialValue).length > 0) {
      setOverrides(initialValue);
      form.setFieldValue(['k8s_options', 'gpuVendorOverrides'], initialValue);
      initializedRef.current = true;
    }
  }, [initialValue, form]);

  // Once the user has touched this section, keep the form mirror in sync
  // so submit collects what's currently on screen even if the form was
  // reset externally (e.g., parent re-renders that touch initialValues).
  useEffect(() => {
    if (!initializedRef.current) return;
    form.setFieldValue(
      ['k8s_options', 'gpuVendorOverrides'],
      Object.keys(overrides).length > 0 ? overrides : undefined
    );
  }, [overrides, form]);

  const vendorKeys = useMemo(() => Object.keys(overrides), [overrides]);

  const availableVendors = useMemo(
    () => vendorOptions.filter((opt) => !vendorKeys.includes(opt.value)),
    [vendorKeys]
  );

  const writeOverrides = (next: Record<string, any>) => {
    setOverrides(next);
    form.setFieldValue(
      ['k8s_options', 'gpuVendorOverrides'],
      Object.keys(next).length > 0 ? next : undefined
    );
    initializedRef.current = true;
  };

  const handleAdd = () => {
    if (availableVendors.length === 0) return;
    const next = availableVendors[0].value;
    writeOverrides({ ...overrides, [next]: { nodeSelector: {} } });
    setCollapseKey(new Set([next]));
  };

  const handleRemove = (vendor: string) => {
    writeOverrides(_.omit(overrides, vendor));
  };

  const handleVendorChange = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    const value = overrides[oldKey] ?? { nodeSelector: {} };
    const next = _.omit(overrides, oldKey);
    next[newKey] = value;
    writeOverrides(next);
    setCollapseKey(new Set([newKey]));
  };

  const handleNodeSelectorChange = (
    vendor: string,
    labels: Record<string, string>
  ) => {
    writeOverrides({
      ...overrides,
      [vendor]: { ...overrides[vendor], nodeSelector: labels }
    });
  };

  const onToggle = (open: boolean, key: string) => {
    setCollapseKey(open ? new Set([key]) : new Set());
  };

  return (
    <SectionWrap>
      <Title>
        <div className="flex-center gap-8">
          <span className="flex-center gap-4">
            <span>
              {intl.formatMessage({ id: 'clusters.gpuVendorOverrides.title' })}
            </span>
            <Tooltip
              title={intl.formatMessage({
                id: 'clusters.gpuVendorOverrides.tip'
              })}
            >
              <QuestionCircleOutlined
                style={{ color: 'var(--ant-color-text-secondary)' }}
              />
            </Tooltip>
          </span>
          <Button
            type="link"
            onClick={handleAdd}
            disabled={availableVendors.length === 0}
          >
            <PlusOutlined />{' '}
            {intl.formatMessage({ id: 'clusters.gpuVendorOverrides.add' })}
          </Button>
        </div>
      </Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {vendorKeys.map((vendor) => {
          const optionsForThisRow = [
            ...vendorOptions.filter(
              (opt) => opt.value === vendor || !vendorKeys.includes(opt.value)
            )
          ];
          const vendorLabel =
            vendorOptions.find((o) => o.value === vendor)?.label || vendor;
          return (
            <div
              key={vendor}
              style={{
                border: '1px solid var(--ant-color-split)',
                borderRadius: 'var(--ant-border-radius-lg)'
              }}
            >
              <CollapseContainer
                collapsible={true}
                showExpandIcon={true}
                open={collapseKey.has(vendor)}
                onToggle={(open: boolean) => onToggle(open, vendor)}
                styles={{
                  body: collapseKey.has(vendor) ? { padding: 16 } : {},
                  content: { paddingTop: 0 },
                  header: { backgroundColor: 'unset' }
                }}
                title={
                  <Label>
                    <span>
                      {intl.formatMessage({
                        id: 'clusters.gpuVendorOverrides.vendor'
                      })}
                      :
                    </span>
                    <span>{vendorLabel}</span>
                  </Label>
                }
                right={
                  <Button
                    size="small"
                    shape="circle"
                    onClick={() => handleRemove(vendor)}
                  >
                    <MinusOutlined />
                  </Button>
                }
              >
                <div style={{ marginBottom: 16, width: '100%' }}>
                  <SealSelect
                    isInFormItems={false}
                    required
                    style={{ width: '100%' }}
                    label={intl.formatMessage({
                      id: 'clusters.gpuVendorOverrides.vendor'
                    })}
                    value={vendor}
                    options={optionsForThisRow}
                    onChange={(value: string) =>
                      handleVendorChange(vendor, value)
                    }
                  ></SealSelect>
                </div>
                <LabelSelector
                  label={intl.formatMessage({
                    id: 'clusters.gpuVendorOverrides.nodeSelector'
                  })}
                  value={overrides[vendor]?.nodeSelector || {}}
                  onChange={(labels) =>
                    handleNodeSelectorChange(vendor, labels)
                  }
                ></LabelSelector>
              </CollapseContainer>
            </div>
          );
        })}
      </div>
    </SectionWrap>
  );
};

type GpuVendorOverridesValue = Record<
  string,
  { nodeSelector?: Record<string, string> }
>;

const K8sPodSpec: React.FC<{
  initialOverrides?: GpuVendorOverridesValue;
}> = ({ initialOverrides }) => {
  return (
    <>
      <ImageCredentialsForm />
      <NodeSelectorForm />
      <GpuVendorOverridesForm initialValue={initialOverrides} />
    </>
  );
};

export default K8sPodSpec;
