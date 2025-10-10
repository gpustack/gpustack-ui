import { MoreOutlined } from '@ant-design/icons';
import { Pagination, Transfer, TransferProps } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

type TransferKey = string | number | bigint;

const PaginationWrapper = styled.div`
  padding: 4px 16px;
`;

const TransferWrap = styled.div`
  .ant-transfer-list {
    width: 100%;
    height: 360px;
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
  total?: number;
  perPage?: number;
  onPageChange?: (page: number, perPage?: number) => void;
  dataSource?: Array<{ key: TransferKey; title: string }>;
  targetKeys?: TransferKey[];
}
const TransferInner: React.FC<TransferInnerProps> = (props) => {
  const [page, setPage] = useState(1);
  const { onPageChange, total, perPage = 30 } = props;

  const handleOnPageChange = (page: number, perPage?: number) => {
    setPage(page);
    onPageChange?.(page, perPage);
  };

  const renderFooter = (TransferProps: any, { direction }: any) => {
    if (direction === 'left' && total && total > perPage!) {
      return (
        <PaginationWrapper>
          <Pagination
            simple={{ readOnly: true }}
            size="small"
            total={total}
            onChange={handleOnPageChange}
            pageSize={perPage}
            current={page}
            showSizeChanger={false}
          />
        </PaginationWrapper>
      );
    }
    return null;
  };

  return (
    <TransferWrap>
      <Transfer
        {...props}
        selectionsIcon={
          <MoreOutlined style={{ fontSize: 14, marginBottom: 3 }} />
        }
      ></Transfer>
    </TransferWrap>
  );
};

export default TransferInner;
