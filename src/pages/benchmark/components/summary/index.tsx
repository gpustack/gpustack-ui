import React from 'react';
import styled from 'styled-components';
import BenchMark from './benchmark';
import Instance from './instance';
import MetricsResult from './metrics-result';
import PercentileResult from './percentile-result';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Summary: React.FC = () => {
  return (
    <Container>
      <Instance />
      <BenchMark />
      <MetricsResult />
      <PercentileResult />
    </Container>
  );
};

export default Summary;
