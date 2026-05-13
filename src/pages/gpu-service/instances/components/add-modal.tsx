import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import Separator from '@/pages/llmodels/components/separator';
import { SearchOutlined } from '@ant-design/icons';
import { ColumnWrapper, GSDrawer, ModalFooter } from '@gpustack/core-ui';
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
  onOk: (values: FormData) => void;
  data?: ListItem | null;
  onCancel: () => void;
};

type InstanceTypeSelection = {
  instanceType?: string;
  manufacturer?: string;
};

const EMPTY_INSTANCE_TYPE_SELECTION: InstanceTypeSelection = {};

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
  onCancel
}) => {
  const intl = useIntl();
  const form = useRef<any>(null);
  const sessionRef = useRef(0);
  const [instanceTypeSelection, setInstanceTypeSelection] =
    useState<InstanceTypeSelection>(EMPTY_INSTANCE_TYPE_SELECTION);
  const [templateId, setTemplateId] = useState<number | undefined>();
  const [instanceKeyword, setInstanceKeyword] = useState('');
  const [templateKeyword, setTemplateKeyword] = useState('');

  const {
    detailData,
    loading: instanceTypesLoading,
    fetchData
  } = useQueryInstanceTypes();
  const { detailData: templatesData, fetchData: fetchTemplates } =
    useQueryTemplates();

  const instanceTypeList = detailData?.items || [];
  const templateList = templatesData?.items || [];

  const findTemplateByManufacturer = (
    manufacturer: string | undefined,
    templates: TemplateItem[]
  ) => {
    return manufacturer
      ? templates.find((t) => t.manufacturer === manufacturer)
      : undefined;
  };

  const applySelection = (
    instanceType: InstanceTypeItem,
    template: TemplateItem | undefined
  ) => {
    const name = instanceType.metadata?.name;
    const manufacturer = instanceType.spec?.manufacturer;

    setInstanceTypeSelection({ instanceType: name, manufacturer });
    setTemplateId(template?.id);

    const currentSpec = form.current?.getFieldsValue()?.spec || {};
    const updatedSpec = {
      ...currentSpec,
      type: name,
      resources: { ...(currentSpec.resources || {}), accelerator: '1' }
    };

    if (template) {
      form.current?.setFieldsValue({
        manufacturer: template.manufacturer,
        spec: {
          ...updatedSpec,
          ...template.spec,
          resources: {
            ...(updatedSpec.resources || {}),
            ...(template.spec?.resources || {})
          }
        }
      });
    } else {
      form.current?.setFieldsValue({
        manufacturer: undefined,
        spec: updatedSpec
      });
    }
  };

  const applyAutoSelection = (
    instanceTypes: InstanceTypeItem[],
    templates: TemplateItem[]
  ) => {
    if (action !== PageAction.CREATE) return;
    if (!instanceTypes.length) return;

    const first = instanceTypes[0];
    const template = findTemplateByManufacturer(
      first.spec?.manufacturer,
      templates
    );

    applySelection(first, template);
  };

  useEffect(() => {
    if (!open) {
      sessionRef.current += 1;
      setInstanceTypeSelection(EMPTY_INSTANCE_TYPE_SELECTION);
      setTemplateId(undefined);
      setInstanceKeyword('');
      setTemplateKeyword('');
      return;
    }

    const session = ++sessionRef.current;
    Promise.all([fetchData({}), fetchTemplates({ page: -1 })]).then(
      ([instanceRes, templatesRes]) => {
        if (sessionRef.current !== session) return;
        applyAutoSelection(instanceRes?.items || [], templatesRes?.items || []);
      }
    );
  }, [open]);

  // filter instance types
  const filteredInstanceTypes = instanceTypeList.filter((item) =>
    matchKeyword(
      [
        item.metadata?.name,
        item.spec?.memory,
        item.status?.cpu?.capacity,
        item.status?.ram?.capacity,
        item.status?.accelerator?.remaining
      ],
      instanceKeyword
    )
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
    onOk({
      ...values
    });
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
    form.current?.setFieldsValue({
      spec: {
        ...form.current?.getFieldsValue()?.spec,
        ...item.spec
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
        wrapper: { width: 'calc(100vw - 220px)' },
        body: { overflowY: 'hidden' }
      }}
      footer={false}
    >
      <div className={styles.container}>
        <div className={styles.colWrapper}>
          <ColumnWrapper styles={{ container: { paddingBlock: 0 } }}>
            <div className={styles.panelBody}>
              <ColTitle style={{ paddingBottom: 0 }}>
                {intl.formatMessage({ id: 'gpuservice.instance.types' })}
              </ColTitle>
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  backgroundColor: 'var(--ant-color-bg-elevated)'
                }}
              >
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
              <ColTitle style={{ paddingBottom: 0 }}>
                {intl.formatMessage({ id: 'gpuservice.instance.templates' })}
              </ColTitle>
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  backgroundColor: 'var(--ant-color-bg-elevated)'
                }}
              >
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
        <div className={styles.formWrapper}>
          <ColumnWrapper
            styles={{ container: { paddingBlock: 0 } }}
            footer={
              <ModalFooter
                onOk={handleSubmit}
                onCancel={handleCancel}
                style={{
                  padding: '16px 24px 8px',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}
              />
            }
          >
            <>
              <ColTitle>
                {intl.formatMessage({ id: 'common.title.config' })}
              </ColTitle>
              <GPUServiceInstanceForm
                ref={form}
                action={action}
                currentData={data}
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
