import { PageActionType } from '@/config/types';
import Separator from '@/pages/llmodels/components/separator';
import { SearchOutlined } from '@ant-design/icons';
import { ColumnWrapper, GSDrawer, ModalFooter } from '@gpustack/core-ui';
import { Empty, Input, Typography } from 'antd';
import { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { mockTemplateData } from '../../templates/config/mock-data';
import { instanceTypeOptions } from '../config';
import { FormData, ListItem } from '../config/types';
import GPUServiceInstanceForm from '../forms';
import TemplateSelector from '../forms/template-selector';
import InstanceTypeList from './instance-type-list';

const Container = styled.div`
  display: flex;
  height: 100%;
  min-height: 0;
`;

const ColWrapper = styled.div`
  display: flex;
  flex: 1;
  max-width: 33.33%;
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
  max-width: 33.33%;
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

const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  onOk,
  data,
  onCancel
}) => {
  const form = useRef<any>(null);
  const [instanceTypeId, setInstanceTypeId] = useState<number>();
  const [templateId, setTemplateId] = useState<number>();
  const [instanceKeyword, setInstanceKeyword] = useState('');
  const [templateKeyword, setTemplateKeyword] = useState('');

  const filteredInstanceTypes = useMemo(() => {
    const keyword = instanceKeyword.trim().toLowerCase();
    if (!keyword) {
      return instanceTypeOptions;
    }
    return instanceTypeOptions.filter((item) =>
      [
        item.name,
        String(item.gpu_count),
        String(item.vram),
        String(item.ram),
        String(item.vCPU)
      ].some((text) => text.toLowerCase().includes(keyword))
    );
  }, [instanceKeyword]);

  const filteredTemplates = useMemo(() => {
    const keyword = templateKeyword.trim().toLowerCase();
    if (!keyword) {
      return mockTemplateData;
    }
    return mockTemplateData.filter((item) =>
      [
        item.name,
        item.image,
        item.vendor,
        item.volume_mount_path,
        String(item.volume_size_gb ?? '')
      ].some((text) => (text || '').toLowerCase().includes(keyword))
    );
  }, [templateKeyword]);

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
                  placeholder="搜索名称、GPU、显存、内存或 vCPU"
                  value={instanceKeyword}
                  onChange={(e) => setInstanceKeyword(e.target.value)}
                />
              </div>
              {filteredInstanceTypes.length > 0 ? (
                <InstanceTypeList
                  value={instanceTypeId}
                  dataList={filteredInstanceTypes}
                  onChange={setInstanceTypeId}
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </PanelBody>
          </ColumnWrapper>
          <Separator></Separator>
        </ColWrapper>
        <ColWrapper>
          <ColumnWrapper styles={{ container: { paddingBlock: 0 } }}>
            <PanelBody>
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
                  placeholder="搜索模板名称、镜像、厂商或挂载路径"
                  value={templateKeyword}
                  onChange={(e) => setTemplateKeyword(e.target.value)}
                />
              </div>
              {filteredTemplates.length > 0 ? (
                <TemplateSelector
                  value={templateId}
                  dataList={filteredTemplates}
                  onChange={setTemplateId}
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
                  backgroundColor: 'var(--ant-color-bg-elevated)'
                }}
              >
                Configuration
              </Typography.Title>
              <GPUServiceInstanceForm
                ref={form}
                action={action}
                currentData={data}
                onFinish={onFinish}
                open={open}
              />
            </>
          </ColumnWrapper>
        </FormWrapper>
      </Container>
    </GSDrawer>
  );
};

export default AddModal;
