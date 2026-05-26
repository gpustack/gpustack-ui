import { Steps } from 'antd';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';

// `description` is intentionally omitted: the upstream step list ships
// hardcoded English copy that isn't translated. Keeping it would cause the
// step to render both the localized title and the English description side
// by side. Same reason we don't surface `subTitle`.
const ANTD_STEP_KEYS = ['title', 'icon', 'status', 'disabled'] as const;

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

  // Pick only props antd's Step accepts — the upstream step objects carry
  // custom keys (showModules/showForms/showButtons/...) that would otherwise
  // be forwarded to the DOM and trigger "React does not recognize the X
  // prop on a DOM element" warnings. _.pick keeps missing keys missing
  // (rather than explicitly `undefined`) so antd's defaults still kick in.
  const visibleSteps = steps
    .filter((step) => !step.hideInSteps)
    .map((step) => _.pick(step, ANTD_STEP_KEYS));

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
