import { StatusColorMap } from '@/config';
import { StatusType } from '@/config/types';
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
  };
  download?: {
    percent: number;
  };
};

const StatusTag: React.FC<StatusTagProps> = ({ statusValue, download }) => {
  const { text, status } = statusValue;
  const [statusColor, setStatusColor] = useState<{ text: string; bg: string }>({
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
      style={
        download
          ? {
              color: StatusColorMap['success']['text'],
              border: `1px solid ${StatusColorMap['success']['text']}`
            }
          : {
              color: statusColor?.text,
              border: `1px solid ${statusColor?.text}`
            }
      }
    >
      {renderContent()}
    </span>
  );
};

export default StatusTag;
