import { useIntl } from '@umijs/max';
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
  const intl = useIntl();
  return (
    <Container>
      <Section
        title={intl.formatMessage({ id: 'benchmark.detail.summary.results' })}
        minHeight={450}
      >
        <MetricsResult />
        <Divider />
        <PercentileResult />
      </Section>
      <Section title={intl.formatMessage({ id: 'benchmark.detail.configure' })}>
        <Instance />
        <Divider />
        <BenchMark />
      </Section>
    </Container>
  );
};

export default Summary;
