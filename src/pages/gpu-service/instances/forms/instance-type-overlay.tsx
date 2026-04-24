import FormOverlayView from '@/pages/_components/form-overlay-view';
import { SearchOutlined } from '@ant-design/icons';
import { Empty, Input } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import InstanceTypeList from '../components/instance-type-list';
import { instanceTypeOptions } from '../config';

const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface InstanceTypeOverlayProps {
  open: boolean;
  value?: number;
  onCancel: () => void;
  onChange?: (value: number) => void;
}

const InstanceTypeOverlay: React.FC<InstanceTypeOverlayProps> = ({
  open,
  value,
  onCancel,
  onChange
}) => {
  const [keyword, setKeyword] = useState('');

  const filteredOptions = useMemo(() => {
    const currentKeyword = keyword.trim().toLowerCase();
    if (!currentKeyword) {
      return instanceTypeOptions;
    }

    return instanceTypeOptions.filter((item) => {
      return [
        item.name,
        String(item.gpu_count),
        String(item.vram),
        String(item.ram),
        String(item.vCPU)
      ].some((text) => text.toLowerCase().includes(currentKeyword));
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
      title="选择实例类型"
      open={open}
      width={600}
      onCancel={onCancel}
      footer={false}
      getContainer={getOverlayContainer}
    >
      <DrawerBody>
        <Input
          allowClear
          prefix={<SearchOutlined className="text-tertiary" />}
          placeholder="搜索名称、GPU、显存、内存或 vCPU"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        {filteredOptions.length > 0 ? (
          <InstanceTypeList
            value={value}
            dataList={filteredOptions}
            onChange={handleChange}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </DrawerBody>
    </FormOverlayView>
  );
};

export default InstanceTypeOverlay;
