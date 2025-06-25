import { Flex, Skeleton, Space } from 'antd';
import styled from 'styled-components';

const Wrapper = styled(Flex)`
  padding: 12px 14px;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--border-radius-base);
  background-color: var(--ant-color-bg-container);
`;

const FileSkeleton: React.FC<{ counts: number; itemHeight?: number }> = ({
  counts = 2,
  itemHeight
}) => {
  return (
    <Wrapper
      vertical
      justify={'space-between'}
      style={{ height: itemHeight || 'auto' }}
    >
      <Skeleton paragraph={{ rows: 1, width: '100%' }} title={false}></Skeleton>
      <Space>
        {Array.from({ length: counts }).map((_, index) => (
          <Skeleton.Node
            style={{ width: 60, height: 22 }}
            key={index}
          ></Skeleton.Node>
        ))}
      </Space>
    </Wrapper>
  );
};

export default FileSkeleton;
