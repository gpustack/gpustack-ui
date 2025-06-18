import { Flex, Skeleton, Space } from 'antd';
import styled from 'styled-components';

const Wrapper = styled(Flex)`
  padding: 12px 14px;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--border-radius-base);
  background-color: var(--ant-color-bg-container);
`;

const FileSkeleton = () => {
  return (
    <Wrapper vertical justify={'space-between'}>
      <Skeleton paragraph={{ rows: 1, width: '100%' }} title={false}></Skeleton>
      <Space>
        <Skeleton.Node style={{ width: 60, height: 22 }}></Skeleton.Node>
        <Skeleton.Node style={{ width: 60, height: 22 }}></Skeleton.Node>
      </Space>
    </Wrapper>
  );
};

export default FileSkeleton;
