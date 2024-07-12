import { StatusColorMap } from '@/config';
import { StatusType } from '@/config/types';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import './index.less';

export const StatusMaps = {
  transitioning: 'blue',
  error: 'red',
  warning: 'orange',
  success: 'success',
  inactive: 'inactive'
};

type StatusTagProps = {
  statusValue: {
    status: StatusType;
    text: string;
    message?: string;
  };
  type?: 'tag' | 'circle';
  download?: {
    percent: number;
  };
};

const StatusTag: React.FC<StatusTagProps> = ({
  statusValue,
  download,
  type = 'tag'
}) => {
  const { text, status } = statusValue;
  const [statusColor, setStatusColor] = useState<{
    text: string;
    bg: string;
    border?: string;
  }>({
    text: '',
    bg: ''
  });

  useEffect(() => {
    setStatusColor(StatusColorMap[status]);
  }, [status]);

  const renderContent = () => {
    const percent = download?.percent || 0;

    if (download && percent > 0 && percent < 100) {
      return (
        <>
          <span className="progress">{download?.percent || 0}%</span>
          <span className="download" style={{ width: `${percent}%` }}></span>
        </>
      );
    }
    return <span>{text}</span>;
  };
  return (
    <span
      className={classNames('status-tag', {
        download: download?.percent
      })}
      style={{
        color: statusColor?.text,
        border: `1px solid ${statusColor?.border || statusColor?.text}`
      }}
    >
      {statusValue.message ? (
        <Tooltip title={statusValue.message}>
          <span className="m-r-5">
            <InfoCircleOutlined />
          </span>
          {renderContent()}
        </Tooltip>
      ) : (
        renderContent()
      )}
    </span>
  );
};

export default StatusTag;
