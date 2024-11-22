import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import React from 'react';
import './styles/pagination.less';

interface LogsPaginationProps {
  page: number;
  total: number;
  pageSize?: number;
  onPrev?: () => void;
  onNext?: () => void;
}

const LogsPagination: React.FC<LogsPaginationProps> = (props) => {
  const { page, total, pageSize, onNext, onPrev } = props;
  const intl = useIntl();

  const handleOnPrev = () => {
    onPrev?.();
  };

  const handleOnNext = () => {
    onNext?.();
  };

  return (
    <div className="pagination">
      <Tooltip
        title={intl.formatMessage(
          { id: 'models.logs.pagination.prev' },
          { lines: pageSize }
        )}
      >
        <Button
          onClick={handleOnPrev}
          type="text"
          shape="circle"
          style={{ color: 'rgba(255,255,255,.7)' }}
        >
          <UpOutlined />
        </Button>
      </Tooltip>
      <span className="pages">
        <span className="curr">{page}</span> /{' '}
        <span className="total">{total}</span>
      </span>
      {page < total && (
        <Tooltip
          title={intl.formatMessage(
            { id: 'models.logs.pagination.next' },
            { lines: pageSize }
          )}
        >
          <Button
            onClick={handleOnNext}
            type="text"
            shape="circle"
            style={{ color: 'rgba(255,255,255,.7)' }}
          >
            <DownOutlined />
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

export default React.memo(LogsPagination);
