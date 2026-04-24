import FormOverlayView from '@/pages/_components/form-overlay-view';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { AutoTooltip, IconFont, TemplateCard } from '@gpustack/core-ui';
import { Button, Empty, Flex, Input } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { mockTemplateData } from '../../templates/config/mock-data';
import { ListItem as TemplateItem } from '../../templates/config/types';

const TemplateGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TemplateContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--ant-color-text-secondary);

  .name {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
    color: var(--ant-color-text);
    font-weight: 500;
  }

  .info {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 8px;
    color: var(--ant-color-text-tertiary);
  }

  .value {
    color: var(--ant-color-text);
  }

  .icon {
    color: var(--ant-color-text-quaternary);
  }
`;

const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface TemplateSelectorProps {
  value?: number;
  onChange?: (value: number) => void;
  dataList?: TemplateItem[];
}

interface TemplateOverlayProps {
  open: boolean;
  value?: number;
  onCancel: () => void;
  onChange?: (value: number) => void;
  onCreate?: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  value,
  onChange,
  dataList = mockTemplateData
}) => {
  return (
    <TemplateGrid>
      {dataList.map((item: TemplateItem) => (
        <TemplateCard
          key={item.id}
          clickable
          ghost
          hoverable
          height={102}
          active={value === item.id}
          disabled={item.status !== 'enabled'}
          onClick={() => onChange?.(item.id)}
        >
          <TemplateContent>
            <div className="name">
              <AutoTooltip ghost minWidth={20}>
                {item.name}
              </AutoTooltip>
              {/* <Tag color={item.status === 'enabled' ? 'success' : 'default'}>
                {item.status === 'enabled' ? '启用' : '停用'}
              </Tag> */}
            </div>
            <div className="info">
              <span>
                <IconFont className="icon" type="icon-model" /> 镜像:
              </span>
              <AutoTooltip ghost minWidth={20}>
                <span className="value">{item.image || '-'}</span>
              </AutoTooltip>
            </div>
            <div className="info">
              <span>
                <IconFont className="icon" type="icon-storage-outlined" /> 存储:
              </span>
              <span className="value">
                {item.volume_size_gb ?? '-'} GB {item.volume_mount_path || '-'}
              </span>
            </div>
          </TemplateContent>
        </TemplateCard>
      ))}
    </TemplateGrid>
  );
};

const TemplateOverlay: React.FC<TemplateOverlayProps> = ({
  open,
  value,
  onCancel,
  onChange,
  onCreate
}) => {
  const [keyword, setKeyword] = useState('');

  const filteredTemplates = useMemo(() => {
    const currentKeyword = keyword.trim().toLowerCase();
    if (!currentKeyword) {
      return mockTemplateData;
    }

    return mockTemplateData.filter((item) => {
      return [
        item.name,
        item.image,
        item.vendor,
        item.volume_mount_path,
        String(item.volume_size_gb ?? '')
      ].some((text) => (text || '').toLowerCase().includes(currentKeyword));
    });
  }, [keyword]);

  const handleChange = (id: number) => {
    onChange?.(id);
    onCancel();
  };

  const getOverlayContainer = useCallback(() => {
    const containers = document.querySelectorAll<HTMLElement>(
      '.ant-layout-content'
    );

    return containers[containers.length - 1] ?? null;
  }, []);

  return (
    <FormOverlayView
      title="选择实例模板"
      open={open}
      width={600}
      onCancel={onCancel}
      getContainer={getOverlayContainer}
      footer={false}
    >
      <DrawerBody>
        <Flex gap={8}>
          <Input
            allowClear
            prefix={<SearchOutlined className="text-tertiary" />}
            placeholder="搜索模板名称、镜像、厂商或挂载路径"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            添加模板
          </Button>
        </Flex>
        {filteredTemplates.length > 0 ? (
          <TemplateSelector
            value={value}
            dataList={filteredTemplates}
            onChange={handleChange}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </DrawerBody>
    </FormOverlayView>
  );
};

export default TemplateOverlay;
