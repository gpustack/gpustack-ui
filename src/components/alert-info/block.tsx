import { WarningFilled } from '@ant-design/icons';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styled from 'styled-components';
import OverlayScroller from '../overlay-scroller';
import './block.less';
interface AlertInfoProps {
  type: 'danger' | 'warning' | 'transition' | 'info';
  message: React.ReactNode;
  rows?: number;
  icon?: React.ReactNode;
  ellipsis?: boolean;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  title: React.ReactNode;
}

const TitleWrapper = styled.div`
  font-weight: 700;
  color: var(--ant-color-text);
`;

const ContentWrapper = styled.div<{ $hasTitle: boolean }>`
  word-break: break-word;
  color: ${(props) =>
    props.$hasTitle
      ? 'var(--ant-color-text-secondary)'
      : 'var(--ant-color-text)'};
  font-weight: var(--font-weight-500);
`;

const AlertInfo: React.FC<AlertInfoProps> = (props) => {
  const {
    message,
    type,
    rows = 1,
    ellipsis,
    style,
    title,
    contentStyle,
    icon
  } = props;

  return (
    <>
      {message ? (
        <div
          className={classNames('alert-info-block', type)}
          style={{ ...style }}
        >
          <Typography.Paragraph
            ellipsis={
              ellipsis ?? {
                rows: rows,
                tooltip: message
              }
            }
          >
            <div className={classNames('title', type)}>
              <span className={classNames('info-icon', type)}>
                {icon ?? <WarningFilled />}
              </span>
            </div>
            {title && <TitleWrapper>{title}</TitleWrapper>}
            <OverlayScroller maxHeight={80} style={{ ...contentStyle }}>
              <ContentWrapper $hasTitle={!!title}>{message}</ContentWrapper>
            </OverlayScroller>
          </Typography.Paragraph>
        </div>
      ) : null}
    </>
  );
};

export default React.memo(AlertInfo);
