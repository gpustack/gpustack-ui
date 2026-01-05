import CollapsibleContainer from '@/components/collapse-container';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { useAddWorkerContext } from './add-worker-context';

interface StepItemProps {
  title: React.ReactNode;
  children?: React.ReactNode;
  name: string;
  disabled?: boolean;
  beforeNext?: () => Promise<boolean> | void;
}

const Box = styled.div`
  border: 1px solid var(--ant-color-border);
  border-radius: 4px;
  &.step-collapse-open {
    border-color: var(--ant-color-primary);
  }
  &:not(.step-collapse-open):hover {
    .ant-card-head {
      background-color: var(--ant-color-fill-tertiary) !important;
      transition: background-color 0.3s;
    }
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  width: 100%;
`;

const StepCollapse: React.FC<StepItemProps> = ({
  title,
  children,
  name = '',
  disabled = false,
  beforeNext = async () => true,
  ...rest
}) => {
  const intl = useIntl();
  const { collapseKey, onToggle, stepList, actionSource, onCancel } =
    useAddWorkerContext();

  const handleOnNext = async () => {
    const res = await beforeNext?.();
    if (!res) return;
    // find the next step and open it
    const nextName = stepList[stepList.indexOf(name) + 1];
    onToggle(true, nextName);
  };

  const handleOnPrevious = () => {
    // find the previous step and open it
    const previousName = stepList[stepList.indexOf(name) - 1];
    onToggle(true, previousName);
  };

  const isLastStep = stepList.indexOf(name) === stepList.length - 1;

  const isFirstStep = stepList.indexOf(name) === 0;

  return (
    <Box
      className={
        collapseKey?.has(name) ? 'step-collapse-open' : 'step-collapse'
      }
    >
      <CollapsibleContainer
        collapsible={true}
        open={collapseKey?.has(name)}
        iconPlacement="right"
        styles={{
          body: collapseKey?.has(name) ? { padding: 16 } : {},
          content: { paddingTop: 0 },
          header: {
            backgroundColor: 'unset'
          }
        }}
        title={title}
        disabled={disabled}
        onToggle={(open) => onToggle?.(open, name || '')}
        {...rest}
      >
        {children}

        <ButtonWrapper>
          {!isFirstStep && (
            <Button onClick={handleOnPrevious}>
              {intl.formatMessage({ id: 'common.button.prev' })}
            </Button>
          )}

          {!isLastStep && (
            <Button type="primary" onClick={handleOnNext} disabled={disabled}>
              {intl.formatMessage({ id: 'common.button.next' })}
            </Button>
          )}
          {isLastStep && actionSource === 'modal' && (
            <Button
              type="primary"
              onClick={onCancel}
              style={{
                minWidth: 88
              }}
            >
              {intl.formatMessage({ id: 'common.button.done' })}
            </Button>
          )}
        </ButtonWrapper>
      </CollapsibleContainer>
    </Box>
  );
};

export default StepCollapse;
