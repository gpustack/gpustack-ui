import styled from 'styled-components';

const Wrapper = styled.div`
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
  overflow: hidden;
`;

const Container = styled.div`
  padding: 16px;
  // border: 1px solid var(--ant-color-border);
  border-radius: 4px;
  .section-title {
    font-weight: 500;
    margin-bottom: 12px;
    font-size: 14px;
  }
  th.ant-descriptions-item {
    padding-bottom: 0;
  }
`;

const Title = styled.div`
  display: flex;
  font-weight: 500;
  // margin-bottom: 12px;
  font-size: 14px;
  gap: 8px;
  padding: 12px 16px;
  align-items: center;
  background-color: var(--ant-color-fill-tertiary);
  border-radius: 4px 4px 0 0;
`;

const DetailSection: React.FC<{
  children: React.ReactNode;
  title?: React.ReactNode;
  styles?: {
    wraper?: React.CSSProperties;
    container?: React.CSSProperties;
    title?: React.CSSProperties;
  };
}> = ({ children, title, styles }) => {
  return (
    <Wrapper style={styles?.wraper}>
      {title && <Title style={styles?.title}>{title}</Title>}
      <Container style={styles?.container}>{children}</Container>
    </Wrapper>
  );
};

export default DetailSection;
