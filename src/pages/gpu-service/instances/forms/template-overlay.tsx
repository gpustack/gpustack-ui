import FormOverlayView from '@/pages/_components/form-overlay-view';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Input } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { mockTemplateData } from '../../templates/config/mock-data';
import TemplateSelector from './template-selector';

const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface TemplateOverlayProps {
  open: boolean;
  value?: number;
  onCancel: () => void;
  onChange?: (value: number) => void;
  onCreate?: () => void;
}

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
      return [item.name, item.image, item.volumeMount].some((text) =>
        (text || '').toLowerCase().includes(currentKeyword)
      );
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
            placeholder="搜索模板名称、镜像或挂载路径"
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
