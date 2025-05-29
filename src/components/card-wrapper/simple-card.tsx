import { createStyles } from 'antd-style';
import React from 'react';
import styled from 'styled-components';

const SimpleCardItemWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 10px;
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
    .title {
      font-size: ${token.fontSize}px;
      font-weight: var(--font-weight-500);
    }
  `
}));
export const SimpleCardItem: React.FC<{
  title?: string;
  content?: React.ReactNode;
  style?: React.CSSProperties;
}> = (props) => {
  const { styles } = useStyles();

  const { title, content, style } = props;

  return (
    <div className={styles.wrapper} style={style}>
      <div className="title">{title}</div>
      <div className="content">{content}</div>
    </div>
  );
};

export const SimpleCard: React.FC<{
  dataList: { label: string; value: React.ReactNode }[];
}> = (props) => {
  const { dataList } = props;

  return (
    <SimpleCardItemWrapper>
      {dataList.map((item, index) => (
        <SimpleCardItem
          key={index}
          title={item.label}
          content={item.value}
        ></SimpleCardItem>
      ))}
    </SimpleCardItemWrapper>
  );
};
