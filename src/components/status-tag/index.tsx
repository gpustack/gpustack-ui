import { StatusColorMap } from '@/config';
import { StatusType } from '@/config/types';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import CopyButton from '../copy-button';
import CopyStyle from './copy.less';
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

    if (download && percent > 0 && percent <= 100) {
      return (
        <>
          <span className="progress">{download?.percent || 0}%</span>
          <span className="download" style={{ width: `${percent}%` }}></span>
        </>
      );
    }
    return <span>{text}</span>;
  };
  const renderTitle = useMemo(() => {
    return (
      <div className={CopyStyle['status-content-wrapper']}>
        <div className="copy-button-wrapper">
          <CopyButton
            style={{ color: 'rgba(255,255,255,.8)' }}
            text={statusValue.message || ''}
            size="small"
          ></CopyButton>
        </div>

        <SimpleBar style={{ maxHeight: 200 }}>
          <div
            style={{
              width: 'max-content',
              maxWidth: 250,
              paddingInline: 10,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {statusValue.message}
          </div>
        </SimpleBar>
      </div>
    );
  }, [statusValue]);
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
        <Tooltip
          title={renderTitle}
          destroyTooltipOnHide={true}
          overlayInnerStyle={{ paddingInline: 0 }}
        >
          <span className="txt err">
            <span className="m-r-5">
              <InfoCircleOutlined />
            </span>
            {renderContent()}
          </span>
        </Tooltip>
      ) : (
        <span className="txt">{renderContent()}</span>
      )}
    </span>
  );
};

export default StatusTag;
