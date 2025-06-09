import { createStyles } from 'antd-style';
import React from 'react';
import styled from 'styled-components';

const SimpleCardItemWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 16px;
`;

const useStyles = createStyles(({ css, token }) => ({
  wrapper: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: ${token.colorBgContainer};
    border-radius: ${token.borderRadius}px;
    padding: ${token.padding}px;
    justify-content: center;
    align-items: center;
    gap: ${token.padding}px;
    &.bordered {
      border: 1px solid ${token.colorBorder};
    }
    .title {
      font-size: ${token.fontSize}px;
      font-weight: var(--font-weight-medium);
    }
    .content {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: ${token.fontSize}px;
      color: ${token.colorTextSecondary};
      gap: 8px;
      .icon {
        display: inline-block;
        width: 10px;
        height: 10px;
        gap: 10px;
        &.roundRect {
          border-radius: 2px;
        }
        &.circle {
          border-radius: 50%;
        }
      }
    }
  `
}));
export const SimpleCardItem: React.FC<{
  title?: string;
  content?: React.ReactNode;
  style?: React.CSSProperties;
  bordered?: boolean;
  color?: string;
  iconType?: string;
}> = (props) => {
  const { styles, cx } = useStyles();

  const { title, content, style, bordered, iconType, color } = props;

  return (
    <div className={cx({ bordered: bordered }, styles.wrapper)} style={style}>
      <div className="title">{title}</div>
      <div className="content">
        <span
          className={cx([iconType], 'icon')}
          style={{
            backgroundColor: color || 'transparent'
          }}
        ></span>
        <span>{content}</span>
      </div>
    </div>
  );
};

export const SimpleCard: React.FC<{
  dataList: {
    label: string;
    value: React.ReactNode;
    color: string;
    iconType: string;
  }[];
  height?: string | number;
  bordered?: boolean;
}> = (props) => {
  const { dataList, bordered } = props;

  return (
    <SimpleCardItemWrapper style={{ height: props.height || '100%' }}>
      {dataList.map((item, index) => (
        <SimpleCardItem
          key={index}
          title={item.label}
          content={item.value}
          bordered={bordered}
          color={item.color}
          iconType={item.iconType}
        ></SimpleCardItem>
      ))}
    </SimpleCardItemWrapper>
  );
};
