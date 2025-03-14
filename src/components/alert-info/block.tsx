import { WarningFilled } from '@ant-design/icons';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import './block.less';
interface AlertInfoProps {
  type: 'danger' | 'warning';
  message: React.ReactNode;
  rows?: number;
  icon?: React.ReactNode;
  ellipsis?: boolean;
  style?: React.CSSProperties;
  title: React.ReactNode;
}

const AlertInfo: React.FC<AlertInfoProps> = (props) => {
  const { message, type, rows = 1, ellipsis, style, title } = props;

  return (
    <>
      {message ? (
        <div
          className={classNames('alert-info-block', type)}
          style={{ ...style }}
        >
          <Typography.Paragraph
            ellipsis={
              ellipsis !== undefined
                ? ellipsis
                : {
                    rows: rows,
                    tooltip: message
                  }
            }
          >
            <div className={classNames('title', type)}>
              <WarningFilled className={classNames('info-icon', type)} />
              <span className="text">{title}</span>
            </div>
            <span className="content">{message}</span>
          </Typography.Paragraph>
        </div>
      ) : null}
    </>
  );
};

export default React.memo(AlertInfo);
