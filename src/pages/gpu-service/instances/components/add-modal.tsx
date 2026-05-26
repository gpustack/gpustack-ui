import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import Separator from '@/pages/llmodels/components/separator';
import { SearchOutlined } from '@ant-design/icons';
import {
  AlertBlockInfo,
  ColumnWrapper,
  GSDrawer,
  ModalFooter
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Empty, Input, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { ListItem as TemplateItem } from '../../templates/config/types';
import useQueryTemplates from '../../templates/services/use-query-templates';
import { FormData, InstanceTypeItem, ListItem } from '../config/types';
import GPUServiceInstanceForm from '../forms';
import TemplateSelector from '../forms/template-selector';
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
  const [loading, setLoading] = useState(false);

  const {
    detailData,
    loading: instanceTypesLoading,
    fetchData
  } = useQueryInstanceTypes();
  const { detailData: templatesData, fetchData: fetchTemplates } =
    useQueryTemplates();

  const instanceTypeList = detailData?.items || [];
  const templateList = templatesData?.items || [];
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
    return JSON.stringify(
      {
        name: instanceType.name,
        spec: {
          ...instanceType.spec
        }
      },
      null,
      2
    );
  };

  // apply the selection of instance type and template
  const applySelection = (
    instanceType: InstanceTypeItem,
    template: TemplateItem | undefined
  ) => {
    const manufacturer = instanceType.spec?.manufacturer;

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

  const findAggregateOf = (
    candidateName: string | undefined,
    clusterId: number | null | undefined,
    instanceTypes: InstanceTypeItem[]
  ): InstanceTypeItem | undefined => {
    if (!candidateName) return undefined;
    return instanceTypes.find((item) =>
      (item.status?.acceleratorTiers ?? []).some((tier) =>
        (tier.candidates ?? []).some(
          (c) => c.name === candidateName && Number(c.cluster) === clusterId
        )
      )
    );
  };

  // initial
  const applyAutoSelection = (
    instanceTypes: InstanceTypeItem[],
    templates: TemplateItem[]
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
          manufacturer: aggregate.spec?.manufacturer
        });
      }
      return;
    }

    const first = instanceTypes.find((item) => !item.disabled);

    if (!first) return;

    // On create, auto-select the first instance type in the list

    const template = findTemplateByManufacturer(
      first.spec?.manufacturer,
      templates
    );

    applySelection(first, template);
  };

  useEffect(() => {
    if (!open) {
      sessionRef.current += 1;
      setInstanceTypeSelection({
        instanceType: undefined,
        manufacturer: undefined
      });
      setTemplateId(undefined);
      setInstanceKeyword('');
      setTemplateKeyword('');
      return;
    }

    if (action === PageAction.CREATE) {
      const session = ++sessionRef.current;
      Promise.all([
        fetchData({ page: 1, perPage: 100 }),
        fetchTemplates({ page: -1 })
      ]).then(([instanceRes, templatesRes]) => {
        if (sessionRef.current !== session) return;
        applyAutoSelection(instanceRes?.items || [], templatesRes?.items || []);
      });
    }
  }, [open, shouldAutoSelectResource, action]);

  // filter instance types
  const filteredInstanceTypes = instanceTypeList.filter((item) =>
    matchKeyword([item.name], instanceKeyword)
  );

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

  const handleSubmit = () => {
    form.current?.submit();
  };

  const handleCancel = () => {
    form.current?.resetFields();
    onCancel();
  };

  const onFinish = async (values: FormData) => {
    setLoading(true);
    try {
      await onOk({
        ...values
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInstanceTypeChange = (item: InstanceTypeItem) => {
    const template = findTemplateByManufacturer(
      item.spec?.manufacturer,
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
          ...item?.spec?.resources,
          accelerator: formValues?.spec?.resources?.accelerator
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
                      {intl.formatMessage({ id: 'gpuservice.instance.types' })}
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
                  {filteredTemplates.length > 0 ? (
                    <TemplateSelector
                      value={templateId}
                      dataList={filteredTemplates}
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
                open={open}
                instanceTypeList={instanceTypeList}
              />
            </>
          </ColumnWrapper>
        </div>
      </div>
    </GSDrawer>
  );
};

export default AddModal;
