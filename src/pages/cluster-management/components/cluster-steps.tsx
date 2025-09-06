import { Steps } from 'antd';
import React from 'react';
import styled from 'styled-components';

const { Step } = Steps;

const Wrapper = styled.div`
  padding-block: 20px;
  background-color: var(--ant-color-bg-container);
  .ant-steps-item-description {
    max-width: 300px !important;
    color: var(--ant-color-text-description) !important;
  }
  .ant-steps-item-content > .ant-steps-item-title {
    font-weight: 600;
  }
`;

const ClusterSteps: React.FC<{
  currentStep: number;
  onChange: (step: number) => void;
  steps: any[];
}> = (props) => {
  const { steps, currentStep, onChange } = props;

  return (
    <Wrapper>
      <Steps current={currentStep} size="small" onChange={onChange}>
        {steps.map((step) => (
          <Step
            disabled={step.disabled}
            key={step.title}
            title={step.title}
            description={step.content}
          />
        ))}
      </Steps>
    </Wrapper>
  );
};

export default ClusterSteps;
