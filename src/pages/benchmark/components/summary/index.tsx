import React from 'react';
import styled from 'styled-components';
import BasicInfo from './basic';
import MetricsInfo from './metrics';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Summary: React.FC = () => {
  return (
    <Container>
      <BasicInfo />
      <MetricsInfo />
    </Container>
  );
};

export default Summary;
