import styled from 'styled-components';

const Content = styled.div`
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 16px;
`;

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // return (
  //   <Content>
  //     <BulbOutlined
  //       style={{ marginRight: 8, color: 'var(--ant-color-text-tertiary)' }}
  //     />
  //     {children}
  //   </Content>
  // );
  return <span></span>;
};

export default Title;
