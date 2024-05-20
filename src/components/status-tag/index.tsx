import { StatusColorMap } from '@/config';
import { StatusType } from '@/config/types';
import { useEffect, useState } from 'react';
import styles from './index.less';

export const StatusMaps = {
  running: 'blue',
  error: 'red',
  warning: 'orange',
  success: 'success'
};

type StatusTagProps = {
  statusValue: {
    status: StatusType;
    text: string;
  };
};

const StatusTag: React.FC<StatusTagProps> = ({ statusValue }) => {
  const { text, status } = statusValue;
  const [statusColor, setStatusColor] = useState<{ text: string; bg: string }>({
    text: '',
    bg: ''
  });

  useEffect(() => {
    setStatusColor(StatusColorMap[status]);
  }, [status]);

  return (
    <span
      className={styles['status-tag']}
      style={{
        color: statusColor.text,
        border: `1px solid ${statusColor.text}`
      }}
    >
      {text}
    </span>
  );
};

export default StatusTag;
