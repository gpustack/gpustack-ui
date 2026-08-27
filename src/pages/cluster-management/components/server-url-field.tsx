import { systemConfigAtom } from '@/atoms/system';
import { Input as CInput, useAppUtils } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useAtomValue } from 'jotai';
import React from 'react';
import { getServerUrlExample, ProviderType } from '../config';
import { ClusterFormData as FormData } from '../config/types';

/**
 * The GPUStack Server URL a worker registers against. A top-level cluster
 * field — the backend hands it back from the cluster-token endpoint and the
 * registration command bakes it into the `--server-url` it prints, so it is
 * consumed during registration and cannot be changed later from the node
 * config YAML (see gpustack/gpustack#5868).
 *
 * Two call sites, split by whether there is a registration step to fall back
 * on. Docker and Kubernetes register their own workers, so the field is an
 * optional override in the "Advanced" collapse: left empty, the cluster keeps
 * following the platform's external URL, which the placeholder shows so the
 * field reads as an override rather than a blank required value. Cloud
 * providers provision workers themselves and have nothing to fall back on, so
 * `components/cloud-provider-form` renders it `required` in the basic form.
 *
 * The tip's example comes from the provider (`getServerUrlExample`) — a
 * Kubernetes Service DNS name reads nothing like the `ip:port` a Docker or
 * cloud worker dials.
 */
const ServerUrlField: React.FC<{
  provider: ProviderType;
  required?: boolean;
}> = ({ provider, required = false }) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const systemConfig = useAtomValue(systemConfigAtom);

  return (
    <Form.Item<FormData>
      name="server_url"
      normalize={(value) => value?.trim?.() || null}
      rules={[
        {
          required,
          message: getRuleMessage('input', 'clusters.create.serverUrl')
        }
      ]}
    >
      <CInput.Input
        label={intl.formatMessage({ id: 'clusters.create.serverUrl' })}
        description={intl.formatMessage(
          { id: 'clusters.form.serverUrl.tips' },
          { example: getServerUrlExample(provider) }
        )}
        required={required}
        placeholder={
          systemConfig?.server_external_url || window.location.origin
        }
        trim={true}
      ></CInput.Input>
    </Form.Item>
  );
};

export default ServerUrlField;
