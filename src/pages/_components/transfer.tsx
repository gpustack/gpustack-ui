import { Transfer, TransferProps } from 'antd';
import styled from 'styled-components';

type TransferKey = string | number | bigint;

const TransferWrap = styled.div`
  .ant-transfer-list {
    width: 100%;
    height: 300px;
  }
  .ant-transfer-list-content {
    .ant-transfer-list-content-item {
      &:hover {
        background-color: var(--ant-control-item-bg-hover);
      }
      &.ant-transfer-list-content-item-checked {
        background-color: unset;
        &:hover {
          background-color: var(--ant-control-item-bg-hover);
        }
      }
    }
  }
  .ant-pagination {
    justify-content: center;
  }
`;

interface TransferInnerProps extends TransferProps {
  dataSource?: Array<{ key: TransferKey; title: string }>;
  targetKeys?: TransferKey[];
}
const TransferInner: React.FC<TransferInnerProps> = (props) => {
  return (
    <TransferWrap>
      <Transfer {...props}></Transfer>
    </TransferWrap>
  );
};

export default TransferInner;
