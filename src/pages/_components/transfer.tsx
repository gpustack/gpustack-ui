import { MoreOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Transfer, TransferProps } from 'antd';
import styled from 'styled-components';

type TransferKey = string | number | bigint;

const TransferWrap = styled.div`
  .ant-transfer-list {
    width: 100%;
    height: 300px;
    .ant-transfer-list-header-dropdown {
      display: none;
    }
    .ant-input-outlined {
      height: 32px;
      padding-block: 4px;
      border-radius: 4px;
    }
  }
  .ant-transfer-operation {
    margin: 0 16px;
    gap: 12px;
    .ant-btn-icon-only {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }
  }
  .ant-transfer-list-content {
    &::-webkit-scrollbar {
      width: var(--scrollbar-size);
    }

    &::-webkit-scrollbar-thumb {
      background-color: transparent;
      border-radius: 4px;
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }

    &:hover {
      &::-webkit-scrollbar-thumb {
        background-color: var(--color-scrollbar-thumb);
        border-radius: 4px;
      }
    }
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
  const intl = useIntl();

  const renderAllLabels = (info: {
    selectedCount: number;
    totalCount: number;
  }) => {
    if (info.selectedCount) {
      return (
        <span style={{ color: 'var(--ant-color-text-secondary)' }}>
          {intl.formatMessage(
            { id: 'common.select.count' },
            { count: info.selectedCount }
          )}
        </span>
      );
    }
    return null;
  };
  return (
    <TransferWrap>
      <Transfer
        {...props}
        selectAllLabels={
          props.selectAllLabels || [renderAllLabels, renderAllLabels]
        }
        selectionsIcon={
          <MoreOutlined style={{ fontSize: 14, marginBottom: 3 }} />
        }
      ></Transfer>
    </TransferWrap>
  );
};

export default TransferInner;
