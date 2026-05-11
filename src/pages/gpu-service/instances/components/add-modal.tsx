import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import Separator from '@/pages/llmodels/components/separator';
import { SearchOutlined } from '@ant-design/icons';
import { ColumnWrapper, GSDrawer, ModalFooter } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Empty, Input, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { ListItem as TemplateItem } from '../../templates/config/types';
import useQueryTemplates from '../../templates/services/use-query-templates';
import { FormData, InstanceTypeItem, ListItem } from '../config/types';
import GPUServiceInstanceForm from '../forms';
import TemplateSelector from '../forms/template-selector';
import useQueryInstanceTypes from '../services/use-query-instance-types';
import InstanceTypeList from './instance-type-list';

const Container = styled.div`
  display: flex;
  height: 100%;
  min-height: 0;
`;

const ColWrapper = styled.div`
  display: flex;
  flex: 1;
  max-width: 33%;
  min-height: 0;
`;

const PanelBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
`;

const FormWrapper = styled.div`
  display: flex;
  flex: 1;
  max-width: 34%;
  min-height: 0;
`;

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: (values: FormData) => void;
  data?: ListItem | null;
  onCancel: () => void;
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
  const autoSelectedRef = useRef(false);
  const [selectedInstanceType, setSelectedInstanceType] = useState<string>();
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>();
  const [templateId, setTemplateId] = useState<number>();
  const [instanceKeyword, setInstanceKeyword] = useState('');
  const [templateKeyword, setTemplateKeyword] = useState('');

  const {
    detailData,
    loading: instanceTypesLoading,
    fetchData
  } = useQueryInstanceTypes();
  const { detailData: templatesData, fetchData: fetchTemplates } =
    useQueryTemplates();

  useEffect(() => {
    if (open) {
      autoSelectedRef.current = false;
      fetchData({});
      fetchTemplates({ page: -1 });
    } else {
      setSelectedInstanceType(undefined);
      setSelectedManufacturer(undefined);
      setTemplateId(undefined);
      setInstanceKeyword('');
      setTemplateKeyword('');
    }
  }, [open, fetchData, fetchTemplates]);

  const instanceTypeList = detailData?.items || [];
  const templateList = templatesData?.items || [];

  const filteredInstanceTypes = useMemo(() => {
    const keyword = instanceKeyword.trim().toLowerCase();
    if (!keyword) {
      return instanceTypeList;
    }
    return instanceTypeList.filter((item) => {
      const name = item.metadata?.name || '';
      return [
        name,
        item.spec?.memory ?? '',
        item.status?.cpu?.capacity ?? '',
        item.status?.ram?.capacity ?? '',
        item.status?.accelerator?.remaining ?? ''
      ].some((text) => String(text).toLowerCase().includes(keyword));
    });
  }, [instanceKeyword, instanceTypeList]);

  const manufacturerMatchedTemplates = useMemo(() => {
    console.log(
      'Filtering templates by manufacturer:',
      templateList,
      selectedManufacturer
    );
    if (!selectedManufacturer) {
      return templateList;
    }
    return templateList.filter(
      (item) => item.manufacturer === selectedManufacturer
    );
  }, [selectedManufacturer, templateList]);

  const filteredTemplates = useMemo(() => {
    const keyword = templateKeyword.trim().toLowerCase();
    if (!keyword) {
      return manufacturerMatchedTemplates;
    }
    return manufacturerMatchedTemplates.filter((item) =>
      [item.name, item.spec?.image, item.spec?.volumeMount].some((text) =>
        (text || '').toLowerCase().includes(keyword)
      )
    );
  }, [templateKeyword, manufacturerMatchedTemplates]);

  useEffect(() => {
    if (!open) return;
    if (action !== PageAction.CREATE) return;
    if (autoSelectedRef.current) return;
    if (!instanceTypeList.length) return;
    if (!templatesData) return;

    const firstInstanceType = instanceTypeList[0];
    const manufacturer = firstInstanceType.spec?.manufacturer;
    const name = firstInstanceType.metadata?.name;
    const matchedTemplate = manufacturer
      ? templateList.find((t) => t.manufacturer === manufacturer)
      : templateList[0];

    autoSelectedRef.current = true;
    setSelectedInstanceType(name);
    setSelectedManufacturer(manufacturer);
    if (matchedTemplate) {
      setTemplateId(matchedTemplate.id);
    }

    const applyToForm = () => {
      const currentSpec = form.current?.getFieldsValue()?.spec || {};
      const updatedSpec = {
        ...currentSpec,
        type: name,
        resources: { ...(currentSpec.resources || {}), accelerator: '1' }
      };

      if (matchedTemplate) {
        form.current?.setFieldsValue({
          manufacturer: matchedTemplate.manufacturer,
          spec: {
            ...updatedSpec,
            ...matchedTemplate.spec,
            resources: {
              ...(updatedSpec.resources || {}),
              ...(matchedTemplate.spec?.resources || {})
            }
          }
        });
      } else {
        form.current?.setFieldsValue({ spec: updatedSpec });
      }
    };

    if (form.current) {
      applyToForm();
    } else {
      queueMicrotask(applyToForm);
    }
  }, [open, action, instanceTypeList, templateList, templatesData]);

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
    const name = item.metadata?.name;
    const manufacturer = item.spec?.manufacturer;
    setSelectedInstanceType(name);
    setSelectedManufacturer(manufacturer);

    const currentSpec = form.current?.getFieldsValue()?.spec || {};
    const updatedSpec = {
      ...currentSpec,
      type: name,
      resources: { ...(currentSpec.resources || {}), accelerator: '1' }
    };

    const currentTemplate = templateList.find((t) => t.id === templateId);
    const isMatched =
      !manufacturer ||
      (!!currentTemplate && currentTemplate.manufacturer === manufacturer);

    if (isMatched) {
      form.current?.setFieldsValue({ spec: updatedSpec });
      return;
    }

    const firstTemplate = templateList.find(
      (t) => t.manufacturer === manufacturer
    );

    if (firstTemplate) {
      setTemplateId(firstTemplate.id);
      form.current?.setFieldsValue({
        manufacturer: firstTemplate.manufacturer,
        spec: {
          ...updatedSpec,
          ...firstTemplate.spec
        }
      });
    } else {
      setTemplateId(undefined);
      form.current?.setFieldsValue({
        manufacturer: undefined,
        spec: updatedSpec
      });
    }
  };

  const handleTemplateChange = (id: number, item: TemplateItem) => {
    setTemplateId(id);
    form.current?.setFieldsValue({
      manufacturer: item.manufacturer,
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
      <Container>
        <ColWrapper>
          <ColumnWrapper styles={{ container: { paddingBlock: 0 } }}>
            <PanelBody>
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
                value={selectedInstanceType}
                dataList={filteredInstanceTypes}
                loading={instanceTypesLoading}
                onChange={handleInstanceTypeChange}
              />
            </PanelBody>
          </ColumnWrapper>
          <Separator></Separator>
        </ColWrapper>
        <ColWrapper>
          <ColumnWrapper styles={{ container: { paddingBlock: 0 } }}>
            <PanelBody>
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
            </PanelBody>
          </ColumnWrapper>
          <Separator></Separator>
        </ColWrapper>
        <FormWrapper>
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
        </FormWrapper>
      </Container>
    </GSDrawer>
  );
};

export default AddModal;
