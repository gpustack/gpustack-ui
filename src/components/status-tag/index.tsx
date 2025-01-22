import { StatusColorMap } from '@/config';
import { StatusType } from '@/config/types';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Divider, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import CopyButton from '../copy-button';
import CopyStyle from './copy-btn.less';
import './index.less';

const linkReg = /<a (.*?)>(.*?)<\/a>/g;
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
  extra?: React.ReactNode;
  actions?: {
    label: string;
    icon?: React.ReactNode;
    key: string;
    onClick?: () => void;
    render?: () => React.ReactNode;
  }[];
};

const StatusTag: React.FC<StatusTagProps> = ({
  statusValue,
  download,
  extra,
  actions = [],
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

  const statusMessage = useMemo(() => {
    return statusValue.message?.replace(linkReg, '');
  }, [statusValue.message]);

  const messageLink = useMemo(() => {
    const link = statusValue.message?.match(linkReg);
    if (link) {
      return link?.[0].replace(linkReg, '<a $1 target="_blank">$2</a>');
    }
    return null;
  }, [statusValue.message]);

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
            text={statusMessage || ''}
            size="small"
          ></CopyButton>
          {actions?.map((item) => {
            return (
              <div key={item.key}>
                <Divider
                  style={{
                    marginBlock: 5,
                    borderColor: 'rgba(255,255,255,.5)'
                  }}
                />
                <Tooltip title={item.label} key={item.key} placement="right">
                  <Button
                    size="small"
                    type="text"
                    style={{ color: 'rgba(255,255,255,.8)', padding: 1 }}
                    onClick={item.onClick}
                  >
                    <span className="font-size-14">{item.icon}</span>
                  </Button>
                </Tooltip>
              </div>
            );
          })}
        </div>

        <SimpleBar
          style={{ maxHeight: 200 }}
          autoHide={false}
          className="tooltip-scrollbar"
        >
          <div
            style={{
              width: 'max-content',
              maxWidth: 250,
              paddingInline: 10,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {statusMessage}
            {statusMessage && <span className="m-r-5"></span>}
            {extra}
            {messageLink && (
              <span dangerouslySetInnerHTML={{ __html: messageLink }}></span>
            )}
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
