import { Col, Row } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { GPUData as GPUDataType, WorkerData } from '../../config/detail-types';
import Section from '../summary/section';
import GPUData from './gpu-data';
import Metadata from './metadata';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: var(--ant-border-radius);
  border: 1px solid var(--ant-color-border);
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 16px;
`;

const Environment: React.FC<{
  workerData: WorkerData;
  gpuData: GPUDataType[];
  title?: React.ReactNode;
}> = (props) => {
  const { title } = props;
  return (
    <Container>
      <Section
        title={title}
        styles={{
          wraper: {
            border: 'none',
            overflow: 'unset'
          },
          container: {
            border: 'none',
            paddingInline: 16,
            borderRadius: 0,
            borderBottom: '1px solid var(--ant-color-split)'
          }
        }}
      >
        <Metadata {...props.workerData} />
      </Section>
      <Content>
        <Row gutter={16}>
          {props.gpuData.map((gpu, index) => (
            <Col span={12} key={index}>
              <GPUData {...gpu} />
            </Col>
          ))}
        </Row>
      </Content>
    </Container>
  );
};

export default Environment;
