import {
  Input as CoreInput,
  Select as CoreSelect,
  MetadataList
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form, Typography } from 'antd';
import { useState } from 'react';
import { DEFAULT_SESSION_KEYS, SESSION_KEY_SOURCE } from '../../config';
import type { FormData } from '../../config/types';
import type { SessionKeyFormItem } from '../../utils/lb-plugins';
import PolicyPluginSection from './policy-plugin-section';
import PolicyWeightField from './policy-weight-field';

const SESSION_KEYS_PATH: ['plugins', 'session-affinity', 'sessionKeys'] = [
  'plugins',
  'session-affinity',
  'sessionKeys'
];

// Register object-array values without forwarding them to a DOM input.
const FieldRegistrar = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

const SessionKeysEditor = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const enabled = Form.useWatch(
    ['plugins', 'session-affinity', 'enabled'],
    form
  );
  // Input values must update synchronously; useWatch notifies in a later task.
  const [sessionKeys, setSessionKeys] = useState<SessionKeyFormItem[]>(
    () => form.getFieldValue(SESSION_KEYS_PATH) || []
  );

  const updateKeys = (keys: SessionKeyFormItem[]) => {
    setSessionKeys(keys);
    form.setFieldValue(SESSION_KEYS_PATH, keys);
    // setFieldValue does not trigger validation, so a submit error on this
    // field would otherwise linger until the next submit even after the user
    // fixed the keys. Re-run it while an error is showing.
    if (form.getFieldError(SESSION_KEYS_PATH).length) {
      form.validateFields([SESSION_KEYS_PATH]).catch(() => {});
    }
  };

  const sourceOptions = [
    {
      value: SESSION_KEY_SOURCE.header,
      label: intl.formatMessage({ id: 'routes.lb.sessionKeys.source.header' })
    },
    {
      value: SESSION_KEY_SOURCE.bodyKey,
      label: intl.formatMessage({ id: 'routes.lb.sessionKeys.source.bodyKey' })
    }
  ];

  return (
    <>
      {/* Register the list field (rows are rendered by MetadataList, not
          Form.List) so submit values and validation still see it. */}
      <Form.Item
        name={SESSION_KEYS_PATH}
        hidden
        noStyle
        rules={[
          {
            validator(rule, value) {
              if (!enabled) {
                return Promise.resolve();
              }
              if (!value?.length) {
                return Promise.reject(
                  intl.formatMessage({ id: 'routes.lb.sessionKeys.required' })
                );
              }
              // Match the submit gate (toServerSessionKeys filters empty
              // keys): an all-blank chain must fail here too, or saving
              // would silently delete the stored session-affinity config.
              if (
                value.some((item: SessionKeyFormItem) => !item?.key?.trim())
              ) {
                return Promise.reject(
                  intl.formatMessage({
                    id: 'routes.lb.sessionKeys.keyRequired'
                  })
                );
              }
              return Promise.resolve();
            }
          }
        ]}
      >
        <FieldRegistrar />
      </Form.Item>
      <MetadataList
        label={intl.formatMessage({ id: 'routes.lb.sessionKeys' })}
        btnText={intl.formatMessage({ id: 'routes.lb.sessionKeys.add' })}
        dataList={sessionKeys}
        styles={{
          // The wrapper is `width: 100%` + padding 14 + border 1 but not
          // box-sizing: border-box (styled-components ships no reset), so its
          // 100% resolves against the content box and overflows the plugin
          // section by 30px. border-box folds the padding/border into the 100%.
          // No bottom margin: the Advanced toggle below owns the gap (16px,
          // symmetric between collapsed and revealed states).
          wrapper: {
            boxSizing: 'border-box'
          }
        }}
        onAdd={() =>
          updateKeys([
            ...sessionKeys,
            { type: SESSION_KEY_SOURCE.header, key: '' }
          ])
        }
        onDelete={(index) =>
          updateKeys(sessionKeys.filter((_k, i) => i !== index))
        }
      >
        {(item: SessionKeyFormItem, index: number) => (
          // minWidth: 0 on both levels lets the row actually shrink to the
          // MetadataList slot — flex items otherwise refuse to go below
          // their intrinsic (Input ≈ 20ch) width and overflow the drawer.
          <Flex gap={10} align="center" style={{ flex: 1, minWidth: 0 }}>
            <Flex style={{ width: 140, flex: 'none' }}>
              <CoreSelect
                options={sourceOptions}
                style={{ width: '100%' }}
                value={item?.type || SESSION_KEY_SOURCE.header}
                onChange={(type) =>
                  updateKeys(
                    sessionKeys.map((k, i) =>
                      i === index ? { ...k, type } : k
                    )
                  )
                }
              />
            </Flex>
            <CoreInput.Input
              trim={false}
              value={item?.key ?? ''}
              placeholder={intl.formatMessage({
                id: 'routes.lb.sessionKeys.keyPlaceholder'
              })}
              style={{ flex: 1, minWidth: 0 }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateKeys(
                  sessionKeys.map((k, i) =>
                    i === index ? { ...k, key: e.target.value } : k
                  )
                )
              }
            />
          </Flex>
        )}
      </MetadataList>
      {/* The field itself is registered hidden (FieldRegistrar above), so its
          validation errors have nowhere to render — surface them here or a
          submit with all keys deleted is blocked silently. */}
      <Form.Item noStyle shouldUpdate={() => true}>
        {() => (
          <Typography.Paragraph type="danger" style={{ marginBottom: 0 }}>
            <Form.ErrorList errors={form.getFieldError(SESSION_KEYS_PATH)} />
          </Typography.Paragraph>
        )}
      </Form.Item>
    </>
  );
};

const SessionAffinityFields = () => {
  const form = Form.useFormInstance<FormData>();

  const handleSwitchChange = (checked: boolean) => {
    if (!checked) {
      return;
    }
    const keys = form.getFieldValue(SESSION_KEYS_PATH);
    if (!keys || keys.length === 0) {
      form.setFieldValue(
        SESSION_KEYS_PATH,
        DEFAULT_SESSION_KEYS.map((item) => ({ ...item }))
      );
    }
  };

  return (
    <PolicyPluginSection
      plugin="session-affinity"
      onSwitchChange={handleSwitchChange}
    >
      <SessionKeysEditor />
      <PolicyWeightField plugin="session-affinity" />
    </PolicyPluginSection>
  );
};

export default SessionAffinityFields;
