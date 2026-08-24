import { AutoComplete, Input as CInput } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import {
  isDockerHubRegistry,
  ProviderLabelMap,
  ProviderType,
  ProviderValueMap,
  SHUIHUA_REGISTRY_SUGGESTIONS
} from '../config';
import { ClusterFormData as FormData } from '../config/types';

/**
 * Default container registry used to resolve images for this cluster. A
 * top-level cluster field shared by every provider (the backend hoists any
 * legacy worker_config value onto this column).
 *
 * Shuihua is the odd one out and owns every difference below, because its
 * instances cannot reach Docker Hub (`check_shuihua_requirements` in the
 * backend's `routes/clusters.py`): the field is mandatory, suggests reachable
 * mirrors, and rejects Docker Hub before submit rather than after. Hence the
 * single `provider` prop — the policy belongs next to the field, while *where*
 * the field renders stays with the two call sites (basic form for Shuihua, the
 * "Advanced" collapse for everyone else).
 */
const DefaultRegistryField: React.FC<{ provider: ProviderType }> = ({
  provider
}) => {
  const intl = useIntl();
  const isShuihua = provider === ProviderValueMap.Shuihua;
  const label = intl.formatMessage({
    id: 'clusters.systemDefaultContainerRegistry.title'
  });

  const shared = {
    label,
    required: isShuihua,
    description: intl.formatMessage({
      id: 'clusters.systemDefaultContainerRegistry.tip'
    }),
    // `docker.io` is a guaranteed rejection for Shuihua, so it must not be the
    // hint there.
    placeholder: isShuihua ? SHUIHUA_REGISTRY_SUGGESTIONS[0] : 'docker.io'
  };

  return (
    <Form.Item<FormData>
      name="system_default_container_registry"
      normalize={(value) => value?.trim?.() || null}
      rules={[
        {
          required: isShuihua,
          message: intl.formatMessage(
            { id: 'common.form.rule.input' },
            { name: label }
          )
        },
        {
          validator: (_rule, value: string) =>
            isShuihua && value && isDockerHubRegistry(value)
              ? Promise.reject(
                  intl.formatMessage(
                    {
                      id: 'clusters.systemDefaultContainerRegistry.dockerHubUnreachable'
                    },
                    { provider: ProviderLabelMap[ProviderValueMap.Shuihua] }
                  )
                )
              : Promise.resolve()
        }
      ]}
    >
      {isShuihua ? (
        <AutoComplete
          {...shared}
          allowClear
          options={SHUIHUA_REGISTRY_SUGGESTIONS.map((value) => ({
            label: value,
            value
          }))}
        ></AutoComplete>
      ) : (
        <CInput.Input {...shared}></CInput.Input>
      )}
    </Form.Item>
  );
};

export default DefaultRegistryField;
