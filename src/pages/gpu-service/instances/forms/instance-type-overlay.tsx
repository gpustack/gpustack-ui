import FormOverlayView from '@/pages/_components/form-overlay-view';
import { SearchOutlined } from '@ant-design/icons';
import { Empty, Input } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import InstanceTypeList from '../components/instance-type-list';
import { InstanceTypeItem } from '../config/types';

const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface InstanceTypeOverlayProps {
  open: boolean;
  value?: string;
  dataList: InstanceTypeItem[];
  onCancel: () => void;
  onChange?: (item: InstanceTypeItem) => void;
}

const InstanceTypeOverlay: React.FC<InstanceTypeOverlayProps> = ({
  open,
  value,
  dataList,
  onCancel,
  onChange
}) => {
  const [keyword, setKeyword] = useState('');

  const filteredOptions = useMemo(() => {
    const currentKeyword = keyword.trim().toLowerCase();
    if (!currentKeyword) {
      return dataList;
    }

    return dataList.filter((item) => {
      const name = item.metadata?.name || item.name || '';
      return [
        name,
        item.spec?.memory ?? '',
        item.status?.cpu?.capacity ?? '',
        item.status?.ram?.capacity ?? '',
        item.status?.accelerator?.remaining ?? ''
      ].some((text) => String(text).toLowerCase().includes(currentKeyword));
    });
  }, [keyword, dataList]);

  const handleChange = (item: InstanceTypeItem) => {
    onChange?.(item);
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
          placeholder="搜索名称、显存、内存或 vCPU"
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
