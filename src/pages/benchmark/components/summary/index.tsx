import { Divider } from 'antd';
import React from 'react';
import styled from 'styled-components';
import BenchMark from './benchmark';
import Instance from './instance';
import MetricsResult from './metrics-result';
import PercentileResult from './percentile-result';
import Section from './section';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Summary: React.FC = () => {
  return (
    <Container>
      <Section title="Results">
        <MetricsResult />
        <Divider />
        <PercentileResult />
      </Section>
      <Section title="Benchmark Details">
        <Instance />
        <Divider />
        <BenchMark />
      </Section>
    </Container>
  );
};

export default Summary;
