import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useSubmitLock from '@/hooks/use-submit-lock';
import useUserDirectory from '@/pages/gpu-service/hooks/use-user-directory';
import Separator from '@/pages/llmodels/components/separator';
import { getGPUStackPlugin } from '@/plugins';
import { SearchOutlined } from '@ant-design/icons';
import { ColumnWrapper, GSDrawer, ModalFooter } from '@gpustack/core-ui';
import { useIntl, useModel } from '@umijs/max';
import { Input, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ListItem as TemplateItem } from '../../templates/config/types';
import useQueryTemplates from '../../templates/services/use-query-templates';
import { InstanceStatusValueMap } from '../config';
import { FormData, InstanceTypeItem, ListItem } from '../config/types';
import GPUServiceInstanceForm from '../forms';
import TemplateSelector, { TemplateGroup } from '../forms/template-selector';
import useQueryInstanceTypes from '../services/use-query-instance-types';
import styles from '../styles/instances.module.less';
import { saveInstanceDataInDescription } from '../utils/instance-description';
import InstanceTypeList from './instance-type-list';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  width?: number | string;
  clusterList?: Array<{
    label: string;
    value: number;
    id: number;
    owner_principal_id?: number;
  }>;
  onOk: (values: FormData) => void;
  data?: ListItem | null;
  onCancel: () => void;
};

const matchKeyword = (fields: Array<unknown>, keyword: string) => {
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) return true;
  return fields.some((text) =>
    String(text ?? '')
      .toLowerCase()
      .includes(trimmed)
  );
};

const ColTitle: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => {
  return (
    <Typography.Title
      level={3}
      style={{
        fontSize: 14,
        paddingTop: 10,
        paddingBottom: 16,
        margin: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--ant-color-bg-elevated)',
        ...style
      }}
    >
      {children}
    </Typography.Title>
  );
};

const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  onOk,
  data,
  onCancel,
  width,
  clusterList = []
}) => {
  const intl = useIntl();
  const { initialState } = useModel('@@initialState') || {};
  const currentUser = initialState?.currentUser;
  const pluginActive = !!getGPUStackPlugin();
  const userDirectory = useUserDirectory(
    !!currentUser?.is_admin && !pluginActive
  );
  const form = useRef<any>(null);
  const sessionRef = useRef(0);
  const [instanceTypeSelection, setInstanceTypeSelection] = useState<{
    instanceType?: string;
    manufacturer?: string;
  }>({
    instanceType: undefined,
    manufacturer: undefined
  });
  const [templateId, setTemplateId] = useState<number | undefined>();
  // Re-selected instance type on a stopped-instance edit. Kept separate from
  // `instanceTypeSelection` (the create card selection) so the two flows don't
  // couple; starts empty each open (no default highlight).
  const [editSelectedType, setEditSelectedType] = useState<string | undefined>(
    undefined
  );
  const [instanceKeyword, setInstanceKeyword] = useState('');
  const [templateKeyword, setTemplateKeyword] = useState('');
  const { loading, guard, run, release } = useSubmitLock();
  const [initialized, setInitialized] = useState(false);

  const {
    detailData: instanceTypeList,
    loading: instanceTypesLoading,
    fetchData
  } = useQueryInstanceTypes();
  const {
    detailData: templatesData,
    loading: templateLoading,
    fetchData: fetchTemplates
  } = useQueryTemplates();
  // Set by the create-scope picker (admin "All" view) via onScopeChange.
  // undefined = no picker (org context) → no client-side scoping.
  const [scopeOrgId, setScopeOrgId] = useState<number | null | undefined>(
    undefined
  );

  const templateList = templatesData?.items || [];

  // A GPU instance is scheduled on the chosen instance type's cluster, and
  // its owner is that cluster's owner. So when a platform admin targets an
  // org, restrict each instance type's candidates to clusters that org owns
  // (dropping tiers/types left with none). Header-independent: filters the
  // fetched list client-side, so it doesn't rely on the request scope.
  const filterTypesByOwner = (
    types: InstanceTypeItem[],
    orgId?: number | null
  ): InstanceTypeItem[] => {
    if (orgId == null) return types;
    const owned = new Set(
      (clusterList || [])
        .filter((c) => c.owner_principal_id === orgId)
        .map((c) => c.id || c.value)
    );
    return types
      .map((it) => ({
        ...it,
        status: {
          ...it.status,
          tiers: (it.status?.tiers ?? [])
            .map((tier: any) => ({
              ...tier,
              candidates: (tier.candidates ?? []).filter((c: any) =>
                owned.has(Number(c.cluster))
              )
            }))
            .filter((tier: any) => (tier.candidates ?? []).length > 0)
        }
      }))
      .filter((it) => (it.status?.tiers ?? []).length > 0);
  };

  const ownedInstanceTypes = useMemo(
    () => filterTypesByOwner(instanceTypeList, scopeOrgId),

    [instanceTypeList, clusterList, scopeOrgId]
  );
  // const readonly = action === PageAction.VIEW;
  const readonly = false;
  const showResourceSelectors = action === PageAction.CREATE;
  // Only a stopped instance can be re-typed on edit. It shows the instance-type
  // column (but not the template column) beside the form; the create card
  // columns render for CREATE.
  const isStoppedEdit =
    action === PageAction.EDIT &&
    data?.status?.phase === InstanceStatusValueMap.Stopped;
  const showInstanceTypeColumn = showResourceSelectors || isStoppedEdit;
  // Editing a non-stopped instance is restricted: only displayName and the
  // SSH public keys stay editable; the type / template / storage sections
  // render disabled. A stopped instance edits everything.
  const isRestrictedEdit = action === PageAction.EDIT && !isStoppedEdit;

  const findTemplateByManufacturer = (
    manufacturer: string | undefined,
    templates: TemplateItem[]
  ) => {
    return manufacturer
      ? templates.find((t) => t.manufacturer === manufacturer)
      : undefined;
  };

  // GPU types carry their accelerator vendor on status.detail (observed — may
  // be absent until the operator backfills status); non-acceleratable (CPU)
  // types all map to the single 'cpu' bucket used to match templates.
  const manufacturerOf = (instanceType: InstanceTypeItem) =>
    instanceType.spec.acceleratable
      ? (instanceType.status?.detail?.manufacturer ?? undefined)
      : 'cpu';

  // apply the selection of instance type and template
  const applySelection = (
    instanceType: InstanceTypeItem,
    template: TemplateItem | undefined
  ) => {
    const manufacturer = manufacturerOf(instanceType);

    setInstanceTypeSelection({
      instanceType: instanceType.name,
      manufacturer
    });

    setTemplateId(template?.id);

    if (template) {
      const formValues = form.current?.getFieldsValue();
      form.current?.setFieldsValue({
        description: saveInstanceDataInDescription(instanceType),
        spec: {
          ...formValues?.spec,
          ...template.spec,
          sshPublicKeys: formValues?.spec?.sshPublicKeys,
          volume: {
            ...formValues?.spec?.volume
          }
        }
      });
    } else {
      form.current?.setFieldsValue({
        description: saveInstanceDataInDescription(instanceType)
      });
    }
    // update form
    form.current?.applyInstanceType?.(instanceType);
  };

  // Drop the instance-type-derived selection + form state. Used when no
  // candidate is available (empty segment / org with no clusters) so a stale
  // type / cluster never survives a switch or reload.
  const clearSelection = () => {
    setInstanceTypeSelection({
      instanceType: undefined,
      manufacturer: undefined
    });
    setTemplateId(undefined);
    form.current?.applyInstanceType?.(undefined);
    form.current?.setFieldValue?.('clusterId', null);
    form.current?.setFieldValue?.(['spec', 'type'], undefined);
  };

  const autoSelectFirst = (
    types: InstanceTypeItem[],
    templates: TemplateItem[]
  ) => {
    const first = types.find((item) => !item.disabled);
    if (!first) {
      clearSelection();
      return;
    }
    applySelection(
      first,
      findTemplateByManufacturer(manufacturerOf(first), templates)
    );
  };

  // initial for first
  const applyAutoSelection = (
    instanceTypes: InstanceTypeItem[],
    templates: TemplateItem[],
    orgId?: number | null
  ) => {
    // Scope to clusters the chosen org owns (admin "All" view).
    const owned = filterTypesByOwner(instanceTypes, orgId);

    // On create, auto-select the first available instance type (clears the
    // selection when the chosen org has none).
    autoSelectFirst(owned, templates);
  };

  // Fetch the (tenant-scoped) instance types + templates and auto-select.
  // The query hook cancels any in-flight request on each new call, so when
  // this runs twice in quick succession (drawer open, then the scope
  // picker settling on its default) the latest scope's result wins.
  const loadCreateResources = async (orgId?: number | null) => {
    const session = ++sessionRef.current;
    try {
      const [instanceResItems, templatesRes] = await Promise.all([
        fetchData({ page: -1 }),
        fetchTemplates({ page: -1 })
      ]);
      if (sessionRef.current !== session) return;
      applyAutoSelection(
        instanceResItems || [],
        templatesRes?.items || [],
        orgId
      );
      setInitialized(true);
    } catch (error) {
      setInitialized(true);
    }
  };

  // Platform admin retargeted the create to another org (or Global). The
  // instance-type / cluster offerings are tenant-scoped, so drop the
  // current pick and reload for the new scope. The request interceptor
  // already carries the new org header by the time this fires.
  const handleScopeChange = (orgId?: number | null) => {
    if (!open || action !== PageAction.CREATE) return;
    setScopeOrgId(orgId);
    // Drop the instance-type-derived selection + form state (the selected type
    // card + its limits, the cluster, and spec.type). The cluster decides
    // where the instance is scheduled, so a stale pick from the previous
    // scope must not survive — otherwise an instance owned by the newly
    // chosen org could land on the old org's cluster. The reload's
    // owner-scoped auto-selection re-fills them from the new org, or leaves
    // them empty (blocking submit) when the chosen org has no clusters.
    clearSelection();
    setInitialized(false);
    loadCreateResources(orgId);
  };

  useEffect(() => {
    if (!open) {
      setInitialized(false);
      sessionRef.current += 1;
      setInstanceTypeSelection({
        instanceType: undefined,
        manufacturer: undefined
      });
      setTemplateId(undefined);
      setEditSelectedType(undefined);
      setInstanceKeyword('');
      setTemplateKeyword('');
      setScopeOrgId(undefined);
      return;
    }

    if (action === PageAction.CREATE) {
      loadCreateResources();
    } else if (action === PageAction.EDIT) {
      // Edit has no card columns, but the change-type overlay still needs the
      // full instance-type list to re-type a stopped instance.
      fetchData({ page: -1 });
    }
  }, [open, action]);

  // filter instance types (already scoped to the chosen org's clusters)
  const filteredInstanceTypes = ownedInstanceTypes.filter((item) =>
    matchKeyword([item.name], instanceKeyword)
  );

  // No instance types for the chosen org (e.g. it owns no clusters), and not
  // mid-fetch — drives the "no available instance type" message in the form.
  const noAvailableInstanceTypes =
    action === PageAction.CREATE &&
    !instanceTypesLoading &&
    ownedInstanceTypes.length === 0;

  // filter templates based on selection and keyword
  const filteredTemplates = templateList.filter((item) => {
    if (
      instanceTypeSelection.manufacturer &&
      item.manufacturer !== instanceTypeSelection.manufacturer
    ) {
      return false;
    }

    return matchKeyword(
      [item.name, item.spec?.image, item.spec?.volumeMount],
      templateKeyword
    );
  });

  // Group the picker by owning scope so same-name templates stay
  // distinguishable: the caller's own templates first, then the
  // admin-curated Global presets, then — platform admin's cross-tenant
  // view only — other users' templates, one group per owner.
  //
  // The default buckets below assume every non-Global owner is a USER
  // principal. A plugin's principal model may scope templates to other
  // owner kinds (no user-directory entry, not the caller's user id),
  // which these buckets would mislabel — so a plugin can take over
  // grouping via `hooks.useTemplateOwnerGroups`. The registry is wired
  // at boot, so the conditional hook call is render-stable — same
  // contract as `usePluginListColumns`' function entries.
  const usePluginTemplateGroups = getGPUStackPlugin()?.hooks
    ?.useTemplateOwnerGroups as
    | ((items: TemplateItem[]) => TemplateGroup[])
    | undefined;
  const pluginTemplateGroups = usePluginTemplateGroups?.(filteredTemplates);

  const templateGroups: TemplateGroup[] = useMemo(() => {
    if (pluginTemplateGroups) {
      return pluginTemplateGroups;
    }
    if (pluginActive) {
      // Plugin present but without the grouping hook (older plugin
      // build): keep the flat list rather than mislabeling owners
      // outside the USER-principal model.
      return filteredTemplates.length
        ? [{ key: 'all', label: null, items: filteredTemplates }]
        : [];
    }
    const yours: TemplateItem[] = [];
    const globals: TemplateItem[] = [];
    const byOwner = new Map<number, TemplateItem[]>();

    filteredTemplates.forEach((item) => {
      if (item.owner_principal_id == null) {
        globals.push(item);
      } else if (item.owner_principal_id === currentUser?.id) {
        yours.push(item);
      } else {
        const list = byOwner.get(item.owner_principal_id) || [];
        list.push(item);
        byOwner.set(item.owner_principal_id, list);
      }
    });

    const groups: TemplateGroup[] = [];
    if (yours.length) {
      groups.push({
        key: 'yours',
        label: intl.formatMessage({ id: 'gpuservice.template.group.yours' }),
        items: yours
      });
    }
    if (globals.length) {
      groups.push({
        key: 'global',
        label: intl.formatMessage({ id: 'gpuservice.template.group.global' }),
        items: globals
      });
    }
    groups.push(
      ...[...byOwner.entries()]
        .map(([ownerId, items]) => ({
          key: `owner-${ownerId}`,
          // `#id` is a placeholder for the moment before the user
          // directory resolves (the memo recomputes once it lands)
          // and for the API-only case of a non-USER owner.
          label: userDirectory.get(ownerId) || `#${ownerId}`,
          items
        }))
        .sort((a, b) => String(a.label).localeCompare(String(b.label)))
    );
    return groups;
  }, [
    filteredTemplates,
    currentUser?.id,
    userDirectory,
    intl,
    pluginActive,
    pluginTemplateGroups
  ]);

  const handleSubmit = () => {
    guard(() => form.current?.submit());
  };

  const handleCancel = () => {
    form.current?.resetFields();
    onCancel();
  };

  const onFinish = async (values: FormData) => {
    await run(async () => {
      await onOk({
        ...values
      });
      console.log('submit form values', values);
    });
  };

  const handleInstanceTypeChange = (item: InstanceTypeItem) => {
    const template = findTemplateByManufacturer(
      manufacturerOf(item),
      templateList
    );
    applySelection(item, template);
  };

  // Stopped-edit re-type. Decoupled from applySelection (the create flow): it
  // only snapshots the type into `description` and applies it to the form — no
  // template selection or filtering.
  const handleEditInstanceTypeChange = (item: InstanceTypeItem) => {
    setEditSelectedType(item.name);
    form.current?.setFieldsValue({
      description: saveInstanceDataInDescription(item)
    });
    form.current?.applyInstanceType?.(item);
  };

  const handleTemplateChange = (id: number, item: TemplateItem) => {
    setTemplateId(id);
    const formValues = form.current?.getFieldsValue();
    form.current?.setFieldsValue({
      spec: {
        ...formValues?.spec,
        ...item.spec,
        sshPublicKeys: formValues?.spec?.sshPublicKeys,
        resources: {
          ...formValues?.spec?.resources,
          localStorage: item?.spec?.resources?.localStorage
        },
        volume: {
          ...formValues?.spec?.volume
        }
      }
    });
  };

  return (
    <GSDrawer
      title={title}
      open={open}
      onClose={handleCancel}
      destroyOnHidden={true}
      closeIcon={false}
      mask={{
        closable: false
      }}
      keyboard={false}
      styles={{
        wrapper: { width: width || 'calc(100vw - 220px)' },
        body: { overflowY: 'hidden' }
      }}
      footer={false}
    >
      <div className={styles.container}>
        {showInstanceTypeColumn && (
          <div
            className={styles.colWrapper}
            // The 33% cap suits the 3-column create layout; in the 2-column
            // stopped-edit layout, split the space evenly with the form column.
            style={isStoppedEdit ? { flex: 1, maxWidth: 'none' } : undefined}
          >
            <ColumnWrapper styles={{ container: { paddingBlock: 0 } }}>
              <div className={styles.panelBody}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    backgroundColor: 'var(--ant-color-bg-elevated)'
                  }}
                >
                  <ColTitle style={{ paddingBottom: 0 }}>
                    {intl.formatMessage({
                      id: 'gpuservice.instance.types'
                    })}
                  </ColTitle>
                  <Input
                    allowClear
                    prefix={<SearchOutlined className="text-tertiary" />}
                    placeholder={intl.formatMessage({
                      id: 'gpuservice.instance.search.type.placeholder'
                    })}
                    value={instanceKeyword}
                    onChange={(e) => setInstanceKeyword(e.target.value)}
                  />
                </div>
                <InstanceTypeList
                  // Edit (stopped) re-selection is decoupled from create's
                  // card selection: separate highlight state + apply handler.
                  value={
                    isStoppedEdit
                      ? editSelectedType
                      : instanceTypeSelection.instanceType
                  }
                  dataList={filteredInstanceTypes}
                  loading={instanceTypesLoading}
                  onChange={
                    isStoppedEdit
                      ? handleEditInstanceTypeChange
                      : handleInstanceTypeChange
                  }
                />
              </div>
            </ColumnWrapper>
            <Separator></Separator>
          </div>
        )}
        {showResourceSelectors && (
          <div className={styles.colWrapper}>
            <ColumnWrapper styles={{ container: { paddingBlock: 0 } }}>
              <div className={styles.panelBody}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    backgroundColor: 'var(--ant-color-bg-elevated)'
                  }}
                >
                  <ColTitle style={{ paddingBottom: 0 }}>
                    {intl.formatMessage({
                      id: 'gpuservice.instance.templates'
                    })}
                  </ColTitle>
                  <Input
                    allowClear
                    prefix={<SearchOutlined className="text-tertiary" />}
                    placeholder={intl.formatMessage({
                      id: 'gpuservice.instance.search.template.placeholder'
                    })}
                    value={templateKeyword}
                    onChange={(e) => setTemplateKeyword(e.target.value)}
                  />
                </div>
                <TemplateSelector
                  value={templateId}
                  loading={templateLoading || !initialized}
                  groups={templateGroups}
                  onChange={handleTemplateChange}
                />
              </div>
            </ColumnWrapper>
            <Separator></Separator>
          </div>
        )}
        <div className={styles.formWrapper}>
          <ColumnWrapper
            styles={{ container: { paddingBlock: 0 } }}
            footer={
              <>
                <ModalFooter
                  onOk={handleSubmit}
                  onCancel={handleCancel}
                  showOkBtn={!readonly}
                  loading={loading}
                  style={{
                    padding: '16px 24px 8px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}
                />
              </>
            }
          >
            <>
              {action !== PageAction.EDIT && (
                <ColTitle>
                  {intl.formatMessage({ id: 'common.title.config' })}
                </ColTitle>
              )}
              <GPUServiceInstanceForm
                ref={form}
                action={action}
                currentData={data}
                disabled={readonly}
                restrictedEdit={isRestrictedEdit}
                onFinish={onFinish}
                onFinishFailed={release}
                onScopeChange={handleScopeChange}
                open={open}
                instanceTypeList={ownedInstanceTypes}
                noAvailableInstanceTypes={noAvailableInstanceTypes}
              />
            </>
          </ColumnWrapper>
        </div>
      </div>
    </GSDrawer>
  );
};

export default AddModal;
