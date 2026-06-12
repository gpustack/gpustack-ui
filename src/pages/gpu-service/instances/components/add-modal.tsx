import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useSubmitLock from '@/hooks/use-submit-lock';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import useUserDirectory from '@/pages/gpu-service/hooks/use-user-directory';
import Separator from '@/pages/llmodels/components/separator';
import { getGPUStackPlugin } from '@/plugins';
import { SearchOutlined } from '@ant-design/icons';
import {
  AlertBlockInfo,
  ColumnWrapper,
  GSDrawer,
  ModalFooter
} from '@gpustack/core-ui';
import { useIntl, useModel } from '@umijs/max';
import { Empty, Input, Typography } from 'antd';
import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ListItem as TemplateItem } from '../../templates/config/types';
import useQueryTemplates from '../../templates/services/use-query-templates';
import { FormData, InstanceTypeItem, ListItem } from '../config/types';
import GPUServiceInstanceForm from '../forms';
import TemplateSelector, { TemplateGroup } from '../forms/template-selector';
import useQueryInstanceTypes from '../services/use-query-instance-types';
import styles from '../styles/instances.module.less';
import InstanceTypeList from './instance-type-list';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  width?: number | string;
  realAction?: string;
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
  realAction
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
  const [instanceKeyword, setInstanceKeyword] = useState('');
  const [templateKeyword, setTemplateKeyword] = useState('');
  const { loading, guard, run, release } = useSubmitLock();
  const initializedRef = useRef(false);

  const {
    detailData: instanceTypeList,
    loading: instanceTypesLoading,
    fetchData
  } = useQueryInstanceTypes();
  const { detailData: templatesData, fetchData: fetchTemplates } =
    useQueryTemplates();
  const { clusterList, fetchClusterList } = useQueryClusterList();
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
    clusters: Array<{
      id?: number;
      value?: number;
      owner_principal_id?: number;
    }>,
    orgId?: number | null
  ): InstanceTypeItem[] => {
    if (orgId == null) return types;
    const owned = new Set(
      (clusters || [])
        .filter((c) => c.owner_principal_id === orgId)
        .map((c) => c.id ?? c.value)
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
    () => filterTypesByOwner(instanceTypeList, clusterList as any, scopeOrgId),

    [instanceTypeList, clusterList, scopeOrgId]
  );
  // const readonly = action === PageAction.VIEW;
  const readonly = false;
  const isRecreate = realAction === PageAction.CREATE;
  const showResourceSelectors = action === PageAction.CREATE || isRecreate;
  const shouldAutoSelectResource = action === PageAction.CREATE && !isRecreate;

  const findTemplateByManufacturer = (
    manufacturer: string | undefined,
    templates: TemplateItem[]
  ) => {
    return manufacturer
      ? templates.find((t) => t.manufacturer === manufacturer)
      : undefined;
  };

  const saveInstanceDataInDescription = (instanceType: InstanceTypeItem) => {
    return JSON.stringify({
      name: instanceType.name,
      spec: {
        ..._.omit(instanceType.spec, ['cache', 'cpu']),
        cpu: _.pick(instanceType.spec?.cpu, [
          'manufacturer',
          'product',
          'family'
        ])
      }
    });
  };

  // GPU types carry their accelerator vendor; non-acceleratable (CPU) types
  // all map to the single 'cpu' bucket used to match templates.
  const manufacturerOf = (instanceType: InstanceTypeItem) =>
    instanceType.spec.acceleratable ? instanceType.spec?.manufacturer : 'cpu';

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

  const findAggregateOf = (
    candidateName: string | undefined,
    clusterId: number | null | undefined,
    instanceTypes: InstanceTypeItem[]
  ): InstanceTypeItem | undefined => {
    if (!candidateName) return undefined;
    return instanceTypes.find((item) =>
      (item.status?.tiers ?? []).some((tier) =>
        (tier.candidates ?? []).some(
          (c) => c.name === candidateName && Number(c.cluster) === clusterId
        )
      )
    );
  };

  // initial for first
  const applyAutoSelection = (
    instanceTypes: InstanceTypeItem[],
    templates: TemplateItem[],
    clusters?: Array<{
      id?: number;
      value?: number;
      owner_principal_id?: number;
    }>,
    orgId?: number | null
  ) => {
    // On edit / view, surface the persisted selection in the card list.
    if (!shouldAutoSelectResource) {
      const aggregate = findAggregateOf(
        data?.spec?.type,
        data?.clusterId,
        instanceTypes
      );
      if (aggregate) {
        setInstanceTypeSelection({
          instanceType: aggregate.name,
          manufacturer: manufacturerOf(aggregate)
        });
      }
      return;
    }

    // Scope to clusters the chosen org owns (admin "All" view).
    const owned = filterTypesByOwner(instanceTypes, clusters || [], orgId);

    // On create, auto-select the first available instance type (clears the
    // selection when the chosen org has none).
    autoSelectFirst(owned, templates);
  };

  // Fetch the (tenant-scoped) instance types + templates and auto-select.
  // The query hook cancels any in-flight request on each new call, so when
  // this runs twice in quick succession (drawer open, then the scope
  // picker settling on its default) the latest scope's result wins.
  const loadCreateResources = (orgId?: number | null) => {
    const session = ++sessionRef.current;
    try {
      Promise.all([
        fetchData({ page: -1 }),
        fetchTemplates({ page: -1 }),
        fetchClusterList({ page: -1 })
      ]).then(([instanceResItems, templatesRes, clusters]) => {
        if (sessionRef.current !== session) return;
        applyAutoSelection(
          instanceResItems || [],
          templatesRes?.items || [],
          (Array.isArray(clusters) ? clusters : (clusters as any)?.items) || [],
          orgId
        );
        initializedRef.current = true;
      });
    } catch (error) {
    } finally {
      initializedRef.current = true;
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
    initializedRef.current = false;
    loadCreateResources(orgId);
  };

  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      sessionRef.current += 1;
      setInstanceTypeSelection({
        instanceType: undefined,
        manufacturer: undefined
      });
      setTemplateId(undefined);
      setInstanceKeyword('');
      setTemplateKeyword('');
      setScopeOrgId(undefined);
      return;
    }

    if (action === PageAction.CREATE) {
      loadCreateResources();
    }
  }, [open, shouldAutoSelectResource, action]);

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
        {showResourceSelectors && (
          <>
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
                    value={instanceTypeSelection.instanceType}
                    dataList={filteredInstanceTypes}
                    loading={instanceTypesLoading}
                    onChange={handleInstanceTypeChange}
                  />
                </div>
              </ColumnWrapper>
              <Separator></Separator>
            </div>
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
                  {filteredTemplates.length > 0 && initializedRef.current ? (
                    <TemplateSelector
                      value={templateId}
                      groups={templateGroups}
                      onChange={handleTemplateChange}
                    />
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>
              </ColumnWrapper>
              <Separator></Separator>
            </div>
          </>
        )}
        <div className={styles.formWrapper}>
          <ColumnWrapper
            styles={{ container: { paddingBlock: 0 } }}
            footer={
              <>
                {isRecreate && open && (
                  <div style={{ marginInline: 24, paddingTop: 8 }}>
                    <AlertBlockInfo
                      type="warning"
                      contentStyle={{ paddingInline: 0 }}
                      message={intl.formatMessage({
                        id: 'gpuservice.instance.recreate.confirm.content'
                      })}
                    />
                  </div>
                )}
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
                realAction={realAction}
                currentData={data}
                disabled={readonly}
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
