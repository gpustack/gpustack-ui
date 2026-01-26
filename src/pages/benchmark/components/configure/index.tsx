import React from 'react';
import styled from 'styled-components';
import { useDetailContext } from '../../config/detail-context';
import Benchmark from './benchmark';
import Instance from './instance';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Configure: React.FC = () => {
  const { detailData } = useDetailContext();
  return (
    <Container>
      <Instance />
      <Benchmark />
    </Container>
  );
};

export default Configure;
