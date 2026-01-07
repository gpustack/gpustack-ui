import { Steps } from 'antd';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

/**
 * --steps-item-base-width: 20px;  type="panel"
 */
const Box = styled.div`
  .indicates {
    color: var(--ant-color-text-tertiary);
    font-size: 14px;
    margin-bottom: 24px;
  }
  .ant-steps {
    .ant-steps-item {
      --steps-item-base-width: 20px;
    }
    .ant-steps-item-rail-wait {
      --steps-item-solid-line-color: var(--ant-color-split);
    }
    &:not(.ant-steps-panel) {
      .ant-steps-item-finish {
        --steps-item-icon-bg-color: var(--ant-color-primary);
      }
    }
  }
`;

const ClusterSteps: React.FC<{
  currentStep: number;
  onChange?: (step: number) => void;
  steps: any[];
}> = (props) => {
  const { steps, currentStep = 0, onChange } = props;

  const visibleSteps = steps.filter((step) => !step.hideInSteps);

  const styles: Record<string, any> = {
    root: {
      '--ant-steps-description-max-width': 'auto'
    },
    item: {
      paddingBlock: 0
    },
    itemIcon: {
      fontSize: 0,
      width: 8,
      height: 8,
      marginInlineStart: 0
    },
    itemWrapper: {
      alignItems: 'center'
    },
    itemRail: {
      borderWidth: 1.5,
      borderRadius: 1,
      insetInlineStart: 10,
      insetInlineEnd: 2,
      '--steps-horizontal-rail-margin': '12px'
    }
  };

  return (
    <Box>
      <Wrapper>
        <Steps
          current={currentStep}
          items={visibleSteps}
          variant="filled"
          size="small"
          styles={styles}
        ></Steps>
      </Wrapper>
    </Box>
  );
};

export default ClusterSteps;
