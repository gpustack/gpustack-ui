import { Steps } from 'antd';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  width: min(1200px, 100%);
  margin: 0 auto;
  padding-block: 0px;
  .ant-steps-item-description {
    max-width: 300px !important;
    color: var(--ant-color-text-description) !important;
  }
`;

const ClusterSteps: React.FC<{
  currentStep: number;
  onChange?: (step: number) => void;
  steps: any[];
}> = (props) => {
  const { steps, currentStep, onChange } = props;

  return (
    <Wrapper>
      <Steps
        items={steps}
        current={currentStep}
        size="small"
        onChange={onChange}
        orientation="vertical"
      ></Steps>
    </Wrapper>
  );
};

export default ClusterSteps;
