import { CheckCircleFilled, CheckCircleOutlined } from '@ant-design/icons';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Box = styled.div`
  .indicates {
    color: var(--ant-color-text-tertiary);
    font-size: 14px;
    margin-bottom: 24px;
  }
`;

const StepItemWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 16px;
  // border-bottom: 1px solid var(--ant-color-split);
  .description {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .title {
      font-weight: 500;
      line-height: 20px;
      color: var(--ant-color-text-tertiary);
    }
    .content {
      line-height: 22px;
      font-size: 14px;
      color: var(--ant-color-text-tertiary);
    }
  }
  &.active {
    .description {
      .title {
        color: var(--ant-color-text);
        font-weight: 600;
      }
      .content {
        color: var(--ant-color-text);
      }
    }
  }
`;

const StepsItem: React.FC<{
  active: boolean;
  item: {
    title: string;
    content: string;
  };
}> = ({ active, item }) => {
  return (
    <StepItemWrapper className={active ? 'active' : ''}>
      <div className="icon">
        {active ? (
          <CheckCircleFilled
            style={{ color: 'var(--ant-color-primary)', fontSize: 20 }}
          />
        ) : (
          <CheckCircleOutlined
            style={{ color: 'var(--ant-color-text-disabled)', fontSize: 20 }}
          />
        )}
      </div>
      <div className="description">
        <div className="title">{item.title}</div>
        <div className="content">{item.content}</div>
      </div>
    </StepItemWrapper>
  );
};

const ClusterSteps: React.FC<{
  currentStep: number;
  onChange?: (step: number) => void;
  steps: any[];
}> = (props) => {
  const { steps, currentStep = 0, onChange } = props;

  return (
    <Box>
      <div className="indicates">
        STEP {currentStep + 1} OF {steps.length}
      </div>
      <Wrapper>
        {steps.map((item, index) => (
          <StepsItem
            key={index}
            active={currentStep === index}
            item={item}
          ></StepsItem>
        ))}
      </Wrapper>
    </Box>
  );
};

export default ClusterSteps;
