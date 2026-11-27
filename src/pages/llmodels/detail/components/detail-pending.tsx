import { Flex, Spin } from 'antd';

export default function DetailPending() {
  return (
    <div aria-busy="true">
      <Flex
        align="center"
        justify="center"
        style={{ minBlockSize: 'min(65vh, 520px)' }}
      >
        <Spin />
      </Flex>
    </div>
  );
}
