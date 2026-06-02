import PluginExtraFields from '@/components/plugin-extra-fields';
import { modelNameReg, PageAction } from '@/config';
import { ClusterStatusValueMap } from '@/pages/cluster-management/config';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import { useBenchmarkTargetInstance } from '@/pages/llmodels/hooks/use-run-benchmark';
import {
  Input as CInput,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import ModelInstanceForm from './model-instance';

const BasicForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { getRuleMessage } = useAppUtils();
  const { action, open, clusterList } = useFormContext();
  const { benchmarkTargetInstance } = useBenchmarkTargetInstance();

  // `organization_id` is owned by the create-scope picker slot (admin "All"
  // view). When a platform admin targets an org (and we're not pre-filling
  // from a launched instance), fetch *that org's* clusters directly — the
  // request header carries the chosen org — rather than filtering the
  // page-level list, which is fetched once and may not include the org's
  // clusters. The benchmark's owner is derived from the chosen cluster.
  const scopeOrgId = Form.useWatch('organization_id', form);
  const orgScoped = scopeOrgId != null && !benchmarkTargetInstance.cluster_id;
  const {
    clusterList: scopedClusterList,
    fetchClusterList: fetchScopedClusters
  } = useQueryClusterList();
  // The org-scoped fetch returns clusters *visible* to the org — its own plus
  // any granted via cluster_access (and the platform principal can see a lot).
  // A benchmark's owner is the chosen cluster's owner, so keep only clusters
  // actually owned by the selected org. The owner filter also keeps this
  // correct if the request header isn't applied (fetch falls back to all).
  const effectiveClusterList = useMemo(() => {
    if (!orgScoped) {
      return clusterList || [];
    }
    return (scopedClusterList || []).filter(
      (item: any) => item.owner_principal_id === scopeOrgId
    );
  }, [orgScoped, scopedClusterList, clusterList, scopeOrgId]);

  useEffect(() => {
    if (action === PageAction.CREATE && orgScoped) {
      fetchScopedClusters({ page: -1 });
    }
  }, [scopeOrgId, orgScoped, action]);

  useEffect(() => {
    if (action !== PageAction.CREATE) {
      return;
    }
    const clusterValue = (item: any) => item?.value ?? item?.id;
    const initClusterId = (list: any[]) => {
      // Find default cluster
      const defaultCluster = list?.find((item) => item.is_default);
      if (defaultCluster) {
        return clusterValue(defaultCluster);
      }

      const readyCluster = list?.find(
        (item) => item.state === ClusterStatusValueMap.Ready
      );
      return clusterValue(readyCluster) ?? clusterValue(list?.[0]);
    };
    const current = form.getFieldValue('cluster_id');
    const stillValid = effectiveClusterList.some(
      (item: any) => clusterValue(item) === current
    );
    if (stillValid) {
      return;
    }
    // Re-pick within the (org-scoped) list. When the chosen org owns no
    // clusters this resolves to undefined, clearing a stale cross-org cluster
    // instead of leaving it selected.
    form.setFieldValue(
      'cluster_id',
      benchmarkTargetInstance.cluster_id || initClusterId(effectiveClusterList)
    );
  }, [form, action, effectiveClusterList, benchmarkTargetInstance]);

  return (
    <>
      <Form.Item<FormData>
        data-field="name"
        name="name"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'common.table.name')
          },
          {
            pattern: modelNameReg,
            message: intl.formatMessage({ id: 'models.form.rules.name' })
          }
        ]}
      >
        <CInput.Input
          label={intl.formatMessage({ id: 'common.table.name' })}
          required
        ></CInput.Input>
      </Form.Item>
      <PluginExtraFields name="CreateOrgScopeField" context={{ action }} />
      <Form.Item<FormData>
        name="cluster_id"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'clusters.title')
          }
        ]}
      >
        <SealSelect
          disabled={action === PageAction.EDIT}
          options={effectiveClusterList}
          label={intl.formatMessage({ id: 'clusters.title' })}
          required
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData> name="model_name" hidden={true}>
        <CInput.Input></CInput.Input>
      </Form.Item>
      <Form.Item<FormData> name="model_id" hidden={true}>
        <CInput.Input></CInput.Input>
      </Form.Item>
      <Form.Item<FormData> name="model_instance_name" hidden={true}>
        <CInput.Input></CInput.Input>
      </Form.Item>
      <ModelInstanceForm></ModelInstanceForm>
      <Form.Item<FormData> name="description">
        <CInput.TextArea
          scaleSize={true}
          label={intl.formatMessage({
            id: 'common.table.description'
          })}
        ></CInput.TextArea>
      </Form.Item>
    </>
  );
};

export default BasicForm;
