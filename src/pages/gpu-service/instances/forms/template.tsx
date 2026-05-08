import { PageAction } from '@/config';
import { EditOutlined } from '@ant-design/icons';
import { AutoTooltip, Input as CInput } from '@gpustack/core-ui';
import { Button, Flex, Form, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  createGPUServiceTemplate,
  updateGPUServiceTemplate
} from '../../templates/apis';
import AddTemplateModal from '../../templates/components/add-modal';
import { mockTemplateData } from '../../templates/config/mock-data';
import {
  FormData as TemplateFormData,
  ListItem as TemplateListItem
} from '../../templates/config/types';
import useCreateTemplate from '../../templates/hooks/use-create-template';
import { FormData } from '../config/types';
import TemplateOverlay from './template-overlay';

const FieldBlock = styled.div`
  margin-bottom: 24px;
`;

const SelectedCard = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius-lg);
  background: var(--ant-color-bg-container);
`;

const SummaryTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--ant-color-text);
  font-weight: 500;
`;

const SummaryMeta = styled.div`
  display: grid;
  gap: 4px;
  color: var(--ant-color-text-secondary);
  font-size: 13px;
`;

interface TemplateSelectorProps {
  value?: number;
  onChange?: (value: number) => void;
  onCreate?: () => void;
  onEdit?: (row: TemplateListItem) => void;
}

const TemplatePicker: React.FC<TemplateSelectorProps> = ({
  value,
  onChange,
  onCreate,
  onEdit
}) => {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    return mockTemplateData.find((item) => item.id === value);
  }, [value]);

  return (
    <>
      <SelectedCard>
        <div>
          <SummaryTitle>
            <AutoTooltip ghost minWidth={20}>
              {selected?.name || '请选择实例模板'}
            </AutoTooltip>
          </SummaryTitle>
          <SummaryMeta>
            <AutoTooltip ghost minWidth={20}>
              <span>镜像: {selected?.image || '-'}</span>
            </AutoTooltip>
            <span>挂载: {selected?.volumeMount || '-'}</span>
          </SummaryMeta>
        </div>
        <Flex gap={8}>
          <Button
            type="text"
            icon={<EditOutlined />}
            disabled={!selected}
            onClick={() => selected && onEdit?.(selected)}
          >
            编辑
          </Button>
          <Button onClick={() => setOpen(true)}>更换</Button>
        </Flex>
      </SelectedCard>
      <TemplateOverlay
        open={open}
        value={value}
        onCancel={() => setOpen(false)}
        onChange={onChange}
        onCreate={() => {
          onCreate?.();
        }}
      />
    </>
  );
};

const TemplateFormItem = () => {
  const form = Form.useFormInstance<FormData & { template_id?: number }>();
  const templateId = Form.useWatch('template_id', form) as number | undefined;
  const { openTemplateModalStatus, openTemplateModal, closeTemplateModal } =
    useCreateTemplate();

  const selectedTemplate = useMemo(() => {
    return mockTemplateData.find((item) => item.id === templateId);
  }, [templateId]);

  useEffect(() => {
    if (!templateId && mockTemplateData[0]) {
      form.setFieldValue('template_id', mockTemplateData[0].id);
      return;
    }

    if (selectedTemplate) {
      form.setFieldValue(['spec', 'image'], selectedTemplate.image);
      form.setFieldValue(['spec', 'command'], selectedTemplate.command || []);
      form.setFieldValue(['spec', 'ports'], selectedTemplate.ports || []);
      form.setFieldValue(['spec', 'env'], selectedTemplate.env || []);
      form.setFieldValue(['spec', 'volumeMount'], selectedTemplate.volumeMount);
      const currentResources = form.getFieldValue(['spec', 'resources']) || {};
      form.setFieldValue(['spec', 'resources'], {
        ...currentResources,
        cpu: selectedTemplate.resources?.cpu,
        ram: selectedTemplate.resources?.ram
      });
    }
  }, [form, selectedTemplate, templateId]);

  const handleAddTemplate = () => {
    openTemplateModal(PageAction.CREATE, '添加实例模板');
  };

  const handleEditTemplate = (row: TemplateListItem) => {
    openTemplateModal(PageAction.EDIT, '编辑实例模板', row);
  };

  const handleTemplateModalOk = async (data: TemplateFormData) => {
    try {
      if (openTemplateModalStatus.action === PageAction.EDIT) {
        await updateGPUServiceTemplate({
          id: openTemplateModalStatus.currentData!.id,
          data
        });
      } else {
        await createGPUServiceTemplate({ data });
      }
      closeTemplateModal();
      message.success('操作成功');
    } catch (error) {
      message.error('操作失败');
    }
  };

  return (
    <div>
      <FieldBlock data-field="template">
        <Form.Item
          name="template_id"
          rules={[
            {
              required: true,
              message: '请选择实例模板'
            }
          ]}
        >
          <TemplatePicker
            onCreate={handleAddTemplate}
            onEdit={handleEditTemplate}
          />
        </Form.Item>
      </FieldBlock>

      <Form.Item<FormData> name={['spec', 'image']} hidden>
        <CInput.Input />
      </Form.Item>

      <AddTemplateModal
        action={openTemplateModalStatus.action}
        open={openTemplateModalStatus.open}
        title={openTemplateModalStatus.title}
        currentData={openTemplateModalStatus.currentData}
        onCancel={closeTemplateModal}
        onOk={handleTemplateModalOk}
      />
    </div>
  );
};

export default TemplateFormItem;
