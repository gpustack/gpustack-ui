import PluginExtraFields from '@/components/plugin-extra-fields';
import { modelNameReg, PageAction } from '@/config';
import { OPENAI_COMPATIBLE } from '@/config/settings';
import {
  ClusterStatusLabelMap,
  ClusterStatusValueMap
} from '@/pages/cluster-management/config';
import {
  AutoTooltip,
  Input as CInput,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useEffect, useMemo } from 'react';
import { DeployFormKeyMap, sourceOptions } from '../config';
import { useFormContext } from '../config/form-context';
import { ClusterOption, FormData } from '../config/types';
import styles from '../style/cluster-option.module.less';
import BackendForm from './backend';
import CatalogFrom from './catalog';
import CustomBackend from './custom-backend';
import LocalPathSource from './local-path-source';
import ModeField from './mode-field';
import OnlineSource from './online-source';

interface BasicFormProps {
  /**
   * PD is on, so this deployment is a *group* and its size lives in
   * `roles[].replicas`.
   *
   * `Model.replicas` degrades to a 0/1 deployment switch under PD (D20), and
   * the form already forces it back to 1 — which left a number field the user
   * could edit and that silently reverted. A control whose value is
   * overwritten is worse than no control, so the field goes.
   *
   * 🔴 It briefly stayed on as a read-only summary of the per-role counts, on
   * the argument that hiding it made the form look like it had lost a
   * question. That reads worse in practice: the counts are *edited* one
   * section down, so the summary answered the same question twice in two
   * places, only one of which responds to a click.
   */
  pdActive?: boolean;
  sourceDisable?: boolean;
  sourceList?: Global.BaseOption<string>[];
  clusterList: ClusterOption[];
  handleClusterChange: (value: number) => void;
  onClusterSeed: (value: number) => void;
  onSourceChange?: (value: string) => void;
}

const BasicForm: React.FC<BasicFormProps> = (props) => {
  const {
    sourceList,
    clusterList,
    sourceDisable,
    handleClusterChange,
    onClusterSeed,
    onSourceChange
  } = props;
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { getRuleMessage } = useAppUtils();
  const { onValuesChange, action, formKey } = useFormContext();

  const handleOnSourceChange = (val: string) => {
    onSourceChange?.(val);
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (action === PageAction.EDIT) {
      const value = e.target.value;
      onValuesChange?.({ name: value }, form.getFieldsValue());
    }
  };

  // `organization_id` is owned by the create-scope picker slot; it only
  // appears when a platform admin is in the "All" view. When set, scope the
  // cluster dropdown to that org's own clusters — the backend derives the
  // deployment's owner from the chosen cluster, so this keeps them aligned.
  const scopeOrgId = Form.useWatch('organization_id', form);

  const clusterOptions = useMemo(() => {
    return clusterList
      ?.filter((item) =>
        scopeOrgId == null ? true : item.owner_principal_id === scopeOrgId
      )
      .map((item) => {
        return {
          label:
            item.state === ClusterStatusValueMap.Ready
              ? item.label
              : `${item.label} [${ClusterStatusLabelMap[item.state as string]}]`,
          value: item.value,
          state: item.state,
          is_default: item.is_default,
          workers: item.workers,
          ready_workers: item.ready_workers,
          gpus: item.gpus
        };
      });
  }, [clusterList, scopeOrgId]);

  // Keep the cluster selection consistent with the available (scoped)
  // options. The modal's open handler seeds a cluster, but that seed can be
  // empty (options not loaded yet) or point outside the current scope (the
  // scope id and the option list both settle after mount, and an org switch
  // re-scopes the list) — leaving the field blank even though a valid option
  // exists. Whenever the scope or the options change, drop an invalid/empty
  // selection and fall back to the scope's default cluster (then a Ready one,
  // then the first) so GPU/backend options refetch for it. A selection that's
  // still valid is left untouched, so a user's (or edit's) choice is kept.
  // Use the seed callback (not handleClusterChange) so this auto-pick refreshes
  // options without firing an evaluate request before a model is selected.
  useEffect(() => {
    // Options derive from clusterList: an empty source list means clusters
    // are still loading — leave the field alone until they arrive.
    if (!clusterList?.length) {
      return;
    }
    // Scope off the live form value, not the `useWatch` snapshot: the scope
    // field's default lands in a child effect that flushes before this one,
    // while the watch still reports the previous render's null — scoping off
    // the watch would seed a cluster from the unscoped list here and only
    // re-scope a render later.
    const liveScopeOrgId = form.getFieldValue('organization_id') ?? null;
    const scoped = clusterList.filter(
      (item) =>
        liveScopeOrgId == null || item.owner_principal_id === liveScopeOrgId
    );
    const current = form.getFieldValue('cluster_id');
    if (!scoped.length) {
      // Clusters are loaded but the picked org owns none. Any leftover
      // selection points at another org's cluster (seeded before the scope
      // settled) and would make requests fail with "Cluster not found" —
      // clear it so the required rule surfaces instead. Create only: an
      // edit's cluster is existing data, not a seed.
      if (action === PageAction.CREATE && current != null) {
        form.setFieldValue('cluster_id', undefined);
      }
      return;
    }
    const stillValid = scoped.some((c) => c.value === current);
    if (current != null && stillValid) {
      return;
    }
    const next =
      scoped.find((c) => c.is_default)?.value ??
      scoped.find((c) => c.state === ClusterStatusValueMap.Ready)?.value ??
      scoped[0]?.value ??
      null;
    if (next == null || next === current) {
      return;
    }
    form.setFieldValue('cluster_id', next);
    onClusterSeed?.(next);
    // `clusterOptions` is the re-run trigger for scope changes: it recomputes
    // whenever the watched org scope or the cluster list settles.
  }, [clusterOptions, clusterList, action, form, onClusterSeed]);

  const clusterOptionRender = (option: any) => {
    const { data } = option;

    return (
      <span className={styles.clusterOption}>
        <span className={styles.label}>
          <AutoTooltip ghost maxWidth={'100%'}>
            {data.label}
          </AutoTooltip>
        </span>
        <span className={styles.meta}>
          <span
            className={`${styles.dot} ${data.ready_workers > 0 ? styles.ready : ''}`}
          ></span>
          <span className="flex-center gap-8">
            <span className="flex-center gap-4 text-tertiary">
              <span>{intl.formatMessage({ id: 'resources.nodes' })}:</span>
              <span>
                {data.ready_workers}/{data.workers}
              </span>
            </span>
            <span className={styles.metaDivider}></span>
            <span className="flex-center gap-4 text-tertiary">
              <span>{intl.formatMessage({ id: 'menu.resources.gpus' })}:</span>
              <span>{data.gpus}</span>
            </span>
          </span>
        </span>
      </span>
    );
  };

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
          onBlur={handleNameBlur}
          description={intl.formatMessage({ id: 'models.form.rules.name' })}
          label={intl.formatMessage({
            id: 'common.table.name'
          })}
          required
        ></CInput.Input>
      </Form.Item>
      <PluginExtraFields name="CreateOrgScopeField" context={{ action }} />

      <Form.Item<FormData>
        name="source"
        hidden={formKey === DeployFormKeyMap.CATALOG}
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'models.form.source')
          }
        ]}
      >
        {
          <SealSelect
            onChange={handleOnSourceChange}
            disabled={sourceDisable}
            label={intl.formatMessage({
              id: 'models.form.source'
            })}
            options={sourceList ?? sourceOptions}
            required
          ></SealSelect>
        }
      </Form.Item>
      <OnlineSource></OnlineSource>
      <LocalPathSource></LocalPathSource>
      <Form.Item<FormData>
        name="cluster_id"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'clusters.title')
          }
        ]}
      >
        {
          <SealSelect
            onChange={handleClusterChange}
            label={intl.formatMessage({ id: 'clusters.title' })}
            options={clusterOptions}
            optionRender={clusterOptionRender}
            required
          ></SealSelect>
        }
      </Form.Item>
      <ModeField></ModeField>
      <CatalogFrom></CatalogFrom>
      <BackendForm></BackendForm>
      <CustomBackend></CustomBackend>
      {/* 🔴 The PD switch used to sit here, between the backend fields and the
          replica count — and before that, overlaid on the replica field's own
          label line. It moved into the «PD 分离配置» panel, next to the roles
          it reveals: the switch and everything it turns on are one topic, and
          splitting them put the control in one section and its entire
          consequence in another. */}
      {/* Gone entirely under PD, not restated as a read-only summary: the
          counts are per role now, and they are *edited* one section down. An
          echo here answered the same question twice in two places, only one
          of which responds to a click. */}
      {!props.pdActive && (
        <Form.Item<FormData>
          name="replicas"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'models.form.replicas')
            }
          ]}
        >
          <CInput.Number
            style={{ width: '100%' }}
            // No spinner: a replica count is typed, not nudged one at a time.
            controls={false}
            // The Replicas field keeps its label/description unchanged even
            // when scheduled scaling is on. While scheduling is on this value
            // doubles as the baseline (idle) replica count — that's explained
            // by a note in the Scheduled Scaling section rather than by
            // relabeling this field.
            label={intl.formatMessage({ id: 'models.form.replicas' })}
            required
            description={intl.formatMessage(
              { id: 'models.form.replicas.tips' },
              { api: `${window.location.origin}/${OPENAI_COMPATIBLE}` }
            )}
            min={0}
          ></CInput.Number>
        </Form.Item>
      )}
      {/* Still registered while PD is on, so the payload carries the 0/1
          switch the backend expects. Hidden rather than absent: the effects
          pin it to 1 and nothing on screen should invite editing it. */}
      {props.pdActive && (
        <Form.Item<FormData> name="replicas" hidden noStyle>
          <input />
        </Form.Item>
      )}
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
