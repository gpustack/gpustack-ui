import styled from 'styled-components';

const Container = styled.div`
  padding: 16px;
  border: 1px solid var(--ant-color-border);
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
  margin-bottom: 12px;
  font-size: 14px;
  gap: 8px;
  align-items: center;
`;

const DetailSection: React.FC<{
  children: React.ReactNode;
  title?: React.ReactNode;
  styles?: {
    container?: React.CSSProperties;
    title?: React.CSSProperties;
  };
}> = ({ children, title, styles }) => {
  return (
    <Container style={styles?.container}>
      {title && <Title style={styles?.title}>{title}</Title>}
      {children}
    </Container>
  );
};

export default DetailSection;
