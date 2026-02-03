import { StatusColorMap } from '@/config';
import { StatusType } from '@/config/types';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Divider, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useMemo } from 'react';
import 'simplebar-react/dist/simplebar.min.css';
import styled from 'styled-components';
import CopyButton from '../copy-button';
import { TooltipOverlayScroller } from '../overlay-scroller';
import CopyStyle from './copy-btn.less';
import './index.less';

const Text = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const linkReg = /<a (.*?)>(.*?)<\/a>/g;
export const StatusMaps = {
  transitioning: 'blue',
  error: 'red',
  warning: 'orange',
  success: 'success',
  inactive: 'inactive'
};

type StatusTagProps = {
  style?: React.CSSProperties;
  statusValue: {
    status: StatusType;
    text: string;
    message?: string;
  };
  type?: 'tag' | 'circle';
  download?: {
    percent: number;
  };
  suffix?: React.ReactNode;
  maxTooltipWidth?: number;
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
  style,
  statusValue,
  download,
  extra,
  actions = [],
  maxTooltipWidth = 250,
  suffix
}) => {
  const { text, status } = statusValue;

  const statusColor = useMemo<{
    text: string;
    bg: string;
    border?: string;
  }>(() => {
    return StatusColorMap[status];
  }, [status]);

  const hasLink = useMemo(() => {
    if (!statusValue.message) return false;
    return linkReg.test(statusValue.message || '');
  }, [statusValue.message]);

  const statusMessage = useMemo<string>(() => {
    if (!statusValue.message) return '';
    const link = statusValue.message?.match(linkReg);
    if (link) {
      return statusValue.message?.replace(
        linkReg,
        `<a $1 target="_blank">$2</a>`
      );
    }
    return statusValue.message;
  }, [statusValue.message]);

  const renderContent = () => {
    const percent = download?.percent || 0;

    if (download && percent > 0 && percent <= 100) {
      return (
        <>
          <span className="progress">
            {_.round(download?.percent, 0) || 0}%
          </span>
          <span
            className="download"
            style={{ width: `${_.round(percent, 0)}%` }}
          ></span>
        </>
      );
    }
    return <Text>{text}</Text>;
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

        <div
          style={{
            width: 'max-content',
            maxWidth: maxTooltipWidth,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {hasLink ? (
            <span dangerouslySetInnerHTML={{ __html: statusMessage }}></span>
          ) : (
            statusMessage
          )}
          {extra && <span className="m-l-5">{extra}</span>}
        </div>
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
        border: `1px solid ${statusColor?.border || statusColor?.text}`,
        ...style
      }}
    >
      {statusValue.message ? (
        <TooltipOverlayScroller
          title={renderTitle}
          scrollbars={{
            autoHide: 'never'
          }}
          toolTipProps={{
            destroyOnHidden: true
          }}
        >
          <span className="txt err">
            <InfoCircleOutlined />
            {renderContent()}
            {suffix && <span>{suffix}</span>}
          </span>
        </TooltipOverlayScroller>
      ) : (
        <span className="txt">
          {renderContent()}
          {suffix && <span>{suffix}</span>}
        </span>
      )}
    </span>
  );
};

export default StatusTag;
